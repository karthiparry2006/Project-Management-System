from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Task, TaskComment
from .serializers import TaskSerializer, TaskCommentSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.all().select_related('project', 'assignee').prefetch_related('comments__author')
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Expects payload: [ { "id": 1, "status": "In Progress", "order": 0 }, ... ]
        """
        items = request.data
        if not isinstance(items, list):
            return Response({'error': 'Expected a list of task updates'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for item in items:
                task_id = item.get('id')
                new_status = item.get('status')
                new_order = item.get('order', 0)
                if task_id:
                    Task.objects.filter(id=task_id).update(status=new_status, order=new_order)

        return Response({'status': 'reordered', 'count': len(items)})

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            comments = task.comments.all().select_related('author')
            serializer = TaskCommentSerializer(comments, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = TaskCommentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(task=task, author=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
