import uvicorn

import ai_trace_datasets.main as main  # noqa: F401  # Configure logging before anything else

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
