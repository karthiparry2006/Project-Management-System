from rest_framework import views, generics, permissions, status
from rest_framework.response import Response
from .models import ChatMessage
from .serializers import ChatMessageSerializer
from .services.rag_service import process_chat_message
from projects.models import Project

class ChatView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        message_text = request.data.get('message', '').strip()
        project_id = request.data.get('project_id')
        session_id = request.data.get('session_id', 'default_session')

        if not message_text:
            return Response({'error': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        project = None
        if project_id:
            project = Project.objects.filter(id=project_id).first()

        # Save user message
        user_msg = ChatMessage.objects.create(
            user=request.user,
            project=project,
            session_id=session_id,
            sender='user',
            content=message_text
        )

        # Process through RAG & Tool service
        result = process_chat_message(
            user=request.user,
            message=message_text,
            project_id=project_id
        )

        # Save assistant message
        action_json = None
        if result.get('action_performed') or result.get('updated_task'):
            action_json = {
                'action_type': result.get('action_type'),
                'updated_task': result.get('updated_task'),
            }

        asst_msg = ChatMessage.objects.create(
            user=request.user,
            project=project,
            session_id=session_id,
            sender='assistant',
            content=result.get('reply', ''),
            structured_action_json=action_json
        )

        return Response({
            'reply': result.get('reply'),
            'action_performed': result.get('action_performed', False),
            'action_type': result.get('action_type'),
            'updated_task': result.get('updated_task'),
            'message_id': asst_msg.id
        })

class ChatHistoryView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        session_id = self.request.query_params.get('session_id', 'default_session')
        qs = ChatMessage.objects.filter(user=self.request.user, session_id=session_id)
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs.order_by('created_at')
