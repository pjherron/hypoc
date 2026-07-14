#!/bin/bash
# Deploy ML API to AWS ECS Fargate with autoscaling

set -e

# Variables
CLUSTER_NAME="ml-cluster"
SERVICE_NAME="ml-api"
TASK_DEFINITION="ml-api"
DESIRED_COUNT=2
MIN_CAPACITY=2
MAX_CAPACITY=10
TARGET_CPU=70

# Create ECS service
echo "Creating ECS service..."
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --task-definition $TASK_DEFINITION \
  --desired-count $DESIRED_COUNT \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={
      subnets=[subnet-abc123,subnet-def456],
      securityGroups=[sg-xyz789],
      assignPublicIp=DISABLED
    }" \
  --load-bhypoccers "targetGroupArn=arn:aws:elasticloadbhypoccing:us-east-1:123456789:targetgroup/ml-api/abc123,containerName=ml-api,containerPort=8000" \
  --health-check-grace-period-seconds 60 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}" \
  --enable-execute-command

echo "Service created. Waiting for stable state..."
aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME

# Set up Application Auto Scaling
echo "Configuring autoscaling..."

# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/$CLUSTER_NAME/$SERVICE_NAME \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity $MIN_CAPACITY \
  --max-capacity $MAX_CAPACITY

# Create scaling policy for CPU
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/$CLUSTER_NAME/$SERVICE_NAME \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name ml-api-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
      "TargetValue": '$TARGET_CPU',
      "PredefinedMetricSpecification": {
        "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
      },
      "ScaleInCooldown": 300,
      "ScaleOutCooldown": 60
    }'

# Create scaling policy for memory
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/$CLUSTER_NAME/$SERVICE_NAME \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name ml-api-memory-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
      "TargetValue": 80.0,
      "PredefinedMetricSpecification": {
        "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
      },
      "ScaleInCooldown": 300,
      "ScaleOutCooldown": 60
    }'

# Create CloudWatch alarms
echo "Creating CloudWatch alarms..."

# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ml-api-high-cpu \
  --alarm-description "Alert when CPU exceeds 85%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 85.0 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=$SERVICE_NAME Name=ClusterName,Value=$CLUSTER_NAME \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alerts

# High memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ml-api-high-memory \
  --alarm-description "Alert when memory exceeds 85%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 85.0 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=$SERVICE_NAME Name=ClusterName,Value=$CLUSTER_NAME \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alerts

# Unhealthy task alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ml-api-unhealthy-tasks \
  --alarm-description "Alert when tasks are unhealthy" \
  --metric-name HealthyTaskCount \
  --namespace ECS/ContainerInsights \
  --statistic Average \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 1.0 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=ServiceName,Value=$SERVICE_NAME Name=ClusterName,Value=$CLUSTER_NAME \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alerts

echo "✅ Deployment complete!"
echo ""
echo "Service URL: https://ml-api.example.com"
echo "Docs: https://ml-api.example.com/docs"
echo ""
echo "Monitor at:"
echo "  - CloudWatch: https://console.aws.amazon.com/cloudwatch"
echo "  - ECS Console: https://console.aws.amazon.com/ecs/v2/clusters/$CLUSTER_NAME/services/$SERVICE_NAME"
echo ""
echo "View logs:"
echo "  aws logs tail /ecs/ml-api --follow"
echo ""
echo "Scale manually:"
echo "  aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --desired-count 5"
