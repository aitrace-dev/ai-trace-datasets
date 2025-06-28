import re
import base64
from typing import Optional

from anthropic import AsyncAnthropic
from sqlalchemy.ext.asyncio import AsyncSession

from ai_trace_datasets.core.models.feature_flag import FEATURE_FLAG_AI_NAME_BY_URL
from ai_trace_datasets.core.repositories.feature_flags import (
    get_feature_flag_by_name_and_org_id,
)
from ai_trace_datasets.core.settings.config import settings

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


async def extract_title_from_url_or_image(db: AsyncSession, organization_id: str, url: str, img_bytes: bytes, image_media_type: str) -> Optional[str]:
    flag = await get_feature_flag_by_name_and_org_id(db, FEATURE_FLAG_AI_NAME_BY_URL, organization_id)
    if not flag or not flag.enabled:
        return None
    prompt = (
        "Given a URL and an image, extract a concise product or object title using the following logic:\n"
        "1. If the URL contains a clear, natural product name/title, use that as the title.\n"
        "2. If the URL does not contain a clear title, analyze the image. If the image contains text, use it. Otherwise, describe the main object or scene as a concise title.\n"
        "3. Respond ONLY with the title wrapped in <title> tags. If no title can be determined, respond with <title></title>.\n\n"
        "Examples:\n"
        "https://example.com/Product-Name-Here + [image] → <title>Product Name Here</title>\n"
        "https://example.com/random-image.jpg + [image of a red mug] → <title>Red Mug</title>\n"
        "https://walmart.com/ip/Specific-Product-Name/12345 + [image] → <title>Specific Product Name</title>\n\n"
        f"URL: {url}"
    )
    image_data = base64.b64encode(img_bytes).decode("utf-8") if img_bytes else None
    try:
        message_content = []
        if img_bytes and image_data and image_media_type:
            message_content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": image_media_type,
                    "data": image_data,
                },
            })
        message_content.append({
            "type": "text",
            "text": prompt
        })
        response = await client.messages.create(
            model="claude-3-5-haiku-latest",
            max_tokens=50,
            messages=[{"role": "user", "content": message_content}],
        )
        if response.content and hasattr(response.content[0], "text"):
            text = response.content[0].text.strip()
            match = re.search(r"<title>(.*?)</title>", text, re.DOTALL)
            if match:
                title = match.group(1).strip()
                if title:
                    return title
    except Exception:
        pass
    return None
