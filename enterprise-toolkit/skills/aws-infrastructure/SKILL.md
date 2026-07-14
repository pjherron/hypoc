---
name: aws-infrastructure
description: AWS cloud infrastructure patterns for EC2, ECS, Lambda, S3, RDS, VPC, IAM, CloudFormation, and serverless architectures. Use when working with AWS services, deploying to cloud, or managing infrastructure.
origin: Custom
---

# AWS Infrastructure Patterns

Production-ready AWS infrastructure and deployment patterns.

## When to Activate

- Deploying applications to AWS
- Designing AWS architecture
- Setting up VPCs, security groups, IAM policies
- Configuring S3, RDS, ECS, Lambda
- Infrastructure as Code (CloudFormation, CDK, Terraform)

## Core AWS Services

### EC2 - Compute Instances

```bash
# Launch instance with user data
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.medium \
  --key-name my-key \
  --security-group-ids sg-abc123 \
  --subnet-id subnet-xyz789 \
  --user-data file://setup.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=my-app}]'
```

**Best Practices:**
- Use Auto Scaling Groups for production
- Enable detailed monitoring
- Use IMDSv2 for metadata access
- Tag all resources for cost tracking

### ECS - Container Orchestration

```json
{
  "family": "my-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:latest",
      "portMappings": [{"containerPort": 8000}],
      "environment": [
        {"name": "ENV", "value": "production"}
      ],
      "secrets": [
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/my-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Best Practices:**
- Use Fargate for serverless containers
- Store secrets in Secrets Manager
- Use ECR for private Docker images
- Enable CloudWatch Logs

### Lambda - Serverless Functions

```python
# FastAPI on Lambda
from mangum import Mangum
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from Lambda"}

# Lambda handler
handler = Mangum(app)
```

**Best Practices:**
- Keep functions under 15MB (unzipped 250MB)
- Use environment variables for config
- Set appropriate timeout (max 15 minutes)
- Use Lambda Layers for dependencies
- Enable X-Ray tracing

### S3 - Object Storage

```python
import boto3

s3 = boto3.client('s3')

# Upload with encryption
s3.put_object(
    Bucket='my-bucket',
    Key='data/file.json',
    Body=json.dumps(data),
    ServerSideEncryption='AES256',
    ContentType='application/json'
)

# Generate presigned URL (temporary access)
url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'my-bucket', 'Key': 'private/file.pdf'},
    ExpiresIn=3600  # 1 hour
)
```

**Best Practices:**
- Enable versioning for critical data
- Use lifecycle policies for cost optimization
- Enable server-side encryption
- Block public access by default
- Use CloudFront for static site hosting

### RDS - Managed Databases

```bash
# Create PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier my-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username admin \
  --master-user-password $DB_PASSWORD \
  --allocated-storage 20 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --vpc-security-group-ids sg-abc123 \
  --db-subnet-group-name my-subnet-group
```

**Best Practices:**
- Use Multi-AZ for production
- Enable automated backups (7-35 days)
- Enable encryption at rest
- Use read replicas for read-heavy workloads
- Store credentials in Secrets Manager

### VPC - Network Isolation

```
VPC (10.0.0.0/16)
├── Public Subnet 1 (10.0.1.0/24) - AZ us-east-1a
│   └── NAT Gateway
├── Public Subnet 2 (10.0.2.0/24) - AZ us-east-1b
│   └── NAT Gateway
├── Private Subnet 1 (10.0.11.0/24) - AZ us-east-1a
│   └── Application Servers
└── Private Subnet 2 (10.0.12.0/24) - AZ us-east-1b
    └── Application Servers
```

**Best Practices:**
- Use private subnets for compute/databases
- Deploy NAT Gateways in public subnets
- Use multiple AZs for high availability
- Enable VPC Flow Logs for monitoring
- Use VPC endpoints for AWS services

### IAM - Identity & Access Management

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789:secret:my-app-*"
    }
  ]
}
```

**Best Practices:**
- Use least privilege principle
- Attach policies to roles, not users
- Use IAM roles for EC2/ECS/Lambda
- Enable MFA for console access
- Rotate credentials regularly

## Infrastructure as Code

### CloudFormation

```yaml
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-app-data
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
```

### AWS CDK (Python)

```python
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_ecs as ecs,
    aws_ec2 as ec2
)

class MyAppStack(Stack):
    def __init__(self, scope, id, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # VPC
        vpc = ec2.Vpc(self, "VPC", max_azs=2)
        
        # ECS Cluster
        cluster = ecs.Cluster(self, "Cluster", vpc=vpc)
        
        # Fargate Service
        ecs.FargateTaskDefinition(self, "Task",
            cpu=256,
            memory_limit_mib=512
        )
```

## Cost Optimization

### Right-Sizing
- Use AWS Cost Explorer
- Enable Compute Optimizer recommendations
- Review instance utilization monthly

### Reserved Instances / Savings Plans
- 1-year or 3-year commitments for predictable workloads
- Up to 72% savings vs on-demand

### Spot Instances
- Use for fault-tolerant workloads
- Up to 90% savings
- Combine with Auto Scaling

### S3 Intelligent Tiering
```python
s3.put_bucket_lifecycle_configuration(
    Bucket='my-bucket',
    LifecycleConfiguration={
        'Rules': [
            {
                'Status': 'Enabled',
                'Transitions': [
                    {'Days': 30, 'StorageClass': 'STANDARD_IA'},
                    {'Days': 90, 'StorageClass': 'GLACIER'}
                ]
            }
        ]
    }
)
```

## Security Best Practices

1. **Enable CloudTrail** - Audit all API calls
2. **Use AWS Config** - Track resource compliance
3. **Enable GuardDuty** - Threat detection
4. **Use Security Hub** - Centralized security view
5. **Encrypt Everything** - At rest and in transit
6. **Use WAF** - Web application firewall
7. **Enable VPC Flow Logs** - Network monitoring

## Monitoring & Alerting

### CloudWatch Alarms

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='high-cpu',
    MetricName='CPUUtilization',
    Namespace='AWS/EC2',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=2,
    Threshold=80.0,
    ComparisonOperator='GreaterThanThreshold',
    ActionsEnabled=True,
    AlarmActions=['arn:aws:sns:us-east-1:123456789:alerts']
)
```

### X-Ray Tracing

```python
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware

app = Flask(__name__)
XRayMiddleware(app, xray_recorder)

@xray_recorder.capture('my_function')
def process_data():
    # Function automatically traced
    pass
```

## Common Patterns

### Multi-Region Architecture
```
Primary Region (us-east-1)
├── Application Load Bhypoccer
├── ECS Fargate Cluster
├── RDS Primary (Multi-AZ)
└── S3 (with Cross-Region Replication)

Failover Region (us-west-2)
├── Application Load Bhypoccer
├── ECS Fargate Cluster (standby)
├── RDS Read Replica
└── S3 Replica Bucket

Route 53 (Global)
└── Health checks + failover routing
```

### Serverless Architecture
```
API Gateway
  → Lambda (FastAPI via Mangum)
    → DynamoDB / RDS Proxy
    → S3 for file storage
    → SQS for async processing
    → EventBridge for scheduling
```

## AWS CLI Essential Commands

```bash
# Configure credentials
aws configure

# List resources
aws ec2 describe-instances
aws s3 ls
aws ecs list-clusters
aws rds describe-db-instances

# Deploy to ECS
aws ecs update-service --cluster my-cluster --service my-service --force-new-deployment

# View logs
aws logs tail /ecs/my-app --follow

# Parameter Store
aws ssm get-parameter --name /my-app/db-url --with-decryption
```

## Troubleshooting

### ECS Task Won't Start
1. Check CloudWatch Logs for container errors
2. Verify IAM task role has required permissions
3. Check security group allows traffic
4. Verify ECR image exists and is accessible

### Lambda Timeout
1. Increase timeout setting (max 15 min)
2. Check CloudWatch Logs for slow operations
3. Optimize cold start (reduce package size)
4. Use provisioned concurrency for critical functions

### S3 Access Denied
1. Check bucket policy
2. Verify IAM role/user permissions
3. Check public access block settings
4. Verify CORS if browser access

## Related Skills

- `docker-patterns` - Container best practices
- `deployment-patterns` - CI/CD workflows
- `security-review` - Security checklist
- `python-patterns` - Python + boto3 usage
