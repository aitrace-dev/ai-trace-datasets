from enum import Enum

from ai_trace_datasets.core.schemas.dataset_schema import DatasetSchemaResponse


class DatasetSchemaName(str, Enum):
    BOOLEAN = "boolean"
    CATEGORICAL = "category"
    MULTI_CATEGORICAL = "multi_category"


DEFAULT_SCHEMAS = [{
    "name": DatasetSchemaName.BOOLEAN.value,
    "description": "Use when we need to classify images as true or false",
    "schema_definition": {
        "type": "object",
        "required": ["img_url", "match"],
        "properties": {
            "img_url": {
                "type": "string",
                "description": "URL of the image",
            },
            "name": {
                "type": "string",
                "description": "Name of the image",
            },
            "description": {
                "type": "string",
                "description": "Description of the image",
            },
            "comments": {
                "type": "string",
                "description": "Additional comments about the image",
            },
            "metadata": {
                "type": "object",
                "description": "Additional metadata for the image",
            },
            "match": {
                "type": "boolean",
                "description": "Is the image a match?",
            }
        }
    }
},
    {
        "name": DatasetSchemaName.CATEGORICAL.value,
        "description": "Use when we need to classify images into one of several categories",
        "schema_definition": {
            "type": "object",
            "required": ["img_url", "category"],
            "properties": {
                "img_url": {
                    "type": "string",
                    "description": "URL of the image",
                },
                "name": {
                    "type": "string",
                    "description": "Name of the image",
                },
                "description": {
                    "type": "string",
                    "description": "Description of the image",
                },
                "comments": {
                    "type": "string",
                    "description": "Additional comments about the image",
                },
                "metadata": {
                    "type": "object",
                    "description": "Additional metadata for the image",
                },
                "category": {
                    "type": "string",
                    "description": "The category of the image",
                    "enum": ["blue", "green", "black"]
                }
            }
        }
    },
    {
        "name": DatasetSchemaName.MULTI_CATEGORICAL.value,
        "description": "Use when we need to classify images into multiple categories",
        "schema_definition": {
            "type": "object",
            "required": ["img_url", "categories"],
            "properties": {
                "img_url": {
                    "type": "string",
                    "description": "URL of the image",
                },
                "name": {
                    "type": "string",
                    "description": "Name of the image",
                },
                "description": {
                    "type": "string",
                    "description": "Description of the image",
                },
                "comments": {
                    "type": "string",
                    "description": "Additional comments about the image",
                },
                "metadata": {
                    "type": "object",
                    "description": "Additional metadata for the image",
                },
                "categories": {
                    "type": "array",
                    "description": "The categories of the image",
                    "items": {
                        "type": "string",
                        "enum": ["blue", "green", "black"]
                    }
                }
            }
        }
    }
]


async def get_default_schemas() -> list[DatasetSchemaResponse]:
    return [DatasetSchemaResponse.model_validate(schema) for schema in DEFAULT_SCHEMAS]