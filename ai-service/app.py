from fastapi import FastAPI  # type: ignore
from pydantic import BaseModel  # type: ignore
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM


class PredictRequest(BaseModel):
    prompt: str
    max_new_tokens: int = 256


model_name = "google/flan-t5-base"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

app = FastAPI()


@app.post("/predict")
async def predict(req: PredictRequest):
    inputs = tokenizer(req.prompt, return_tensors="pt")
    outputs = model.generate(
        **inputs,
        max_new_tokens=req.max_new_tokens,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
    )
    text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return {"result": text}


if __name__ == "__main__":
    import uvicorn  # type: ignore

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
