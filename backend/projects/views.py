from datetime import date
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        project = self.get_object()
        tasks = project.tasks.all()
        total_tasks = tasks.count()

        status_counts = {
            'Backlog': tasks.filter(status='Backlog').count(),
            'In Progress': tasks.filter(status='In Progress').count(),
            'In Review': tasks.filter(status='In Review').count(),
            'Done': tasks.filter(status='Done').count(),
        }

        priority_counts = {
            'Low': tasks.filter(priority='Low').count(),
            'Medium': tasks.filter(priority='Medium').count(),
            'High': tasks.filter(priority='High').count(),
            'Urgent': tasks.filter(priority='Urgent').count(),
        }

        today = date.today()
        overdue_count = tasks.exclude(status='Done').filter(due_date__lt=today).count()
        completion_rate = round((status_counts['Done'] / total_tasks * 100), 1) if total_tasks > 0 else 0

        return Response({
            'project_id': project.id,
            'project_name': project.name,
            'total_tasks': total_tasks,
            'status_counts': status_counts,
            'priority_counts': priority_counts,
            'overdue_count': overdue_count,
            'completion_rate': completion_rate
        })
