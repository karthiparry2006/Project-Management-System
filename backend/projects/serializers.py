from rest_framework import serializers
from .models import Project
from accounts.serializers import UserSerializer

class ProjectSerializer(serializers.ModelSerializer):
    owner_details = UserSerializer(source='owner', read_only=True)
    task_count = serializers.IntegerField(source='tasks.count', read_only=True)
    completed_task_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'start_date', 'target_deadline',
            'status', 'owner', 'owner_details', 'task_count', 'completed_task_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'task_count', 'completed_task_count']

    def get_completed_task_count(self, obj):
        return obj.tasks.filter(status='Done').count()
