#!/usr/bin/env python3
import docker
import json

client = docker.from_env()
images = client.images.list()

print(f"Found {len(images)} images\n")

for image in images[:3]:  # Just show first 3 images
    attrs = image.attrs
    print(f"Image: {image.short_id}")
    print(f"  RepoTags: {attrs.get('RepoTags', [])}")
    print(f"  Created: {attrs.get('Created')}")
    print(f"  Created Type: {type(attrs.get('Created'))}")
    print(f"  Size: {attrs.get('Size')}")
    print()
