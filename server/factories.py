# factories.py
import factory
from model import Interaction, db

class InteractionFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Interaction
        sqlalchemy_session = db.session

    id = factory.Sequence(lambda n: n)
    user_id = factory.Faker('uuid4')
    input_text = factory.Faker('sentence')
    response_text = factory.Faker('sentence')