from rest_framework import serializers
from .models import Task, TaskComment
from accounts.serializers import UserSerializer
from projects.serializers import ProjectSerializer

class TaskCommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'author_details', 'message', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    assignee_details = UserSerializer(source='assignee', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    comment_count = serializers.IntegerField(source='comments.count', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'project', 'project_name',
            'assignee', 'assignee_details', 'priority', 'status',
            'order', 'due_date', 'comment_count', 'comments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'project_name', 'comment_count', 'comments']
