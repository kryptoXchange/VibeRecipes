from __future__ import annotations

import boto3
from botocore.exceptions import ClientError

import config

_s3 = boto3.client(
    "s3",
    endpoint_url=config.S3_ENDPOINT,
    aws_access_key_id=config.S3_ACCESS_KEY,
    aws_secret_access_key=config.S3_SECRET_KEY,
    region_name="us-east-1",
)


def ensure_bucket() -> None:
    try:
        _s3.head_bucket(Bucket=config.S3_BUCKET)
    except ClientError:
        _s3.create_bucket(Bucket=config.S3_BUCKET)


def upload_video(path: str, key: str) -> str:
    _s3.upload_file(path, config.S3_BUCKET, key, ExtraArgs={"ContentType": "video/mp4"})
    return f"{config.S3_PUBLIC_URL}/{key}"


def upload_clip(path: str, key: str) -> None:
    _s3.upload_file(path, config.S3_BUCKET, key, ExtraArgs={"ContentType": "video/mp4"})


def download(key: str, dest: str) -> str:
    _s3.download_file(config.S3_BUCKET, key, dest)
    return dest
