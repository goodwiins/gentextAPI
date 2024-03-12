from flask import Blueprint
routes = Blueprint('routes', __name__)

from .user import *
from .test import *
