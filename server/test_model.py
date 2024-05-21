# test_model.py
import pytest
from model import Interaction, db
from factories import InteractionFactory

@pytest.fixture
def interaction():
    return InteractionFactory()

def test_create_interaction(interaction):
    db.session.add(interaction)
    db.session.commit()
    assert Interaction.query.count() == 1

def test_read_interaction(interaction):
    db.session.add(interaction)
    db.session.commit()
    interaction_in_db = Interaction.query.first()
    assert interaction_in_db.id == interaction.id

def test_update_interaction(interaction):
    db.session.add(interaction)
    db.session.commit()
    interaction_in_db = Interaction.query.first()
    interaction_in_db.input_text = 'New input text'
    db.session.commit()
    interaction_in_db = Interaction.query.first()
    assert interaction_in_db.input_text == 'New input text'

def test_delete_interaction(interaction):
    db.session.add(interaction)
    db.session.commit()
    db.session.delete(interaction)
    db.session.commit()
    assert Interaction.query.count() == 0