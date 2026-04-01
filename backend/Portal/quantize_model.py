from optimum.onnxruntime import ORTModelForFeatureExtraction
from transformers import AutoTokenizer
import os

MODEL_PATH = 'models/chemistry_tagger'
ORIGINAL_MODEL = 'intfloat/multilingual-e5-small'  # берём токенайзер отсюда
ONNX_PATH = 'models/chemistry_tagger_onnx'
QUANTIZED_PATH = 'models/chemistry_tagger_quantized'

print("Шаг 1 — конвертируем в ONNX...")
model = ORTModelForFeatureExtraction.from_pretrained(
    MODEL_PATH,
    export=True
)
# берём токенайзер из оригинальной модели
tokenizer = AutoTokenizer.from_pretrained(ORIGINAL_MODEL)
model.save_pretrained(ONNX_PATH)
tokenizer.save_pretrained(ONNX_PATH)
print(f"ONNX модель сохранена в {ONNX_PATH}")

print("Шаг 2 — квантуем в int8...")
from optimum.onnxruntime.configuration import AutoQuantizationConfig
from optimum.onnxruntime import ORTQuantizer

quantizer = ORTQuantizer.from_pretrained(ONNX_PATH)
qconfig = AutoQuantizationConfig.avx512_vnni(
    is_static=False,
    per_channel=False
)
quantizer.quantize(
    save_dir=QUANTIZED_PATH,
    quantization_config=qconfig
)
print(f"Квантованная модель сохранена в {QUANTIZED_PATH}")

print("\nРазмеры:")
for path in [MODEL_PATH, ONNX_PATH, QUANTIZED_PATH]:
    size = sum(
        os.path.getsize(os.path.join(dirpath, f))
        for dirpath, _, files in os.walk(path)
        for f in files
    ) / 1024 / 1024
    print(f"  {path}: {size:.1f} MB")