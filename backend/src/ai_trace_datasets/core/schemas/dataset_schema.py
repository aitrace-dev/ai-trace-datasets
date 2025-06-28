from pydantic import BaseModel


class DatasetSchemaResponse(BaseModel):
    name: str
    description: str
    schema_definition: dict
