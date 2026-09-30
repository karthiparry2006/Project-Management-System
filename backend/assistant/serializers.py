from rest_framework import serializers
from .models import ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'user', 'project', 'session_id', 'sender', 'content', 'structured_action_json', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
