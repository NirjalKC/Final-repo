from flask import Blueprint, send_file, session
from io import BytesIO
import random
import string
from captcha.image import ImageCaptcha
from utils.captcha import generate_captcha

captcha_bp = Blueprint("captcha", __name__)

@captcha_bp.route("/captcha/generate", methods=["GET"])
def get_captcha():
    # Generate two different random numbers
    num1 = random.randint(1, 20)
    num2 = random.randint(1, 20)
    while num2 == num1:  # Make sure numbers are different
        num2 = random.randint(1, 20)

    operations = ['+', 'minus', 'multiply']
    operation = random.choice(operations)

    # Calculate the result
    if operation == '+':
        result = num1 + num2
    elif operation == 'minus':
        # Swap numbers if subtraction not positive
        if num1 < num2:
            num1, num2 = num2, num1
        result = num1 - num2
    else:  # multiplication
        result = num1 * num2

    captcha_text = f"{num1} {operation} {num2}"
    session['captcha_result'] = str(result)
    
    image = generate_captcha(captcha_text)
    img_io = BytesIO()
    image.save(img_io, 'PNG')
    img_io.seek(0)
    
    return send_file(img_io, mimetype='image/png')
