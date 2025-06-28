import imghdr
import io

from fastapi import HTTPException


def validate_image(image_bytes: io.BytesIO) -> tuple[bytes, str]:
    image_bytes.seek(0)
    contents = image_bytes.read()
    image_type = imghdr.what(None, h=contents)

    if image_type is None:
        first_100_bytes = contents[:100]
        if b"ypavif" in first_100_bytes:
            image_type = "avif"
        else:
            raise HTTPException(status_code=400, detail="Invalid image file")

    allowed_types = [
        "jpeg",
        "jpg",
        "png",
        "gif",
        "avif",
        "webp",
        "bmp",
        "tiff",
        "tiff",
        "svg",
    ]
    if image_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format: {image_type}. Allowed formats: {', '.join(allowed_types)}",
        )

    return contents, image_type
