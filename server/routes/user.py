from flask import render_template
from . import routes
import services.user as svc

@routes.route('/users')
def users():
    return svc.test_user()
