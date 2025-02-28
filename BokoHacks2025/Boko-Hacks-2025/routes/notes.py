from flask import Blueprint, render_template, request, jsonify, session
from extensions import db
from models.user import User
from models.note import Note
from datetime import datetime
from sqlalchemy import text

notes_bp = Blueprint('notes', __name__, url_prefix='/apps/notes')

def get_current_user():
    """Helper function to get current authenticated user"""
    if 'user' not in session:
        return None
    return User.query.filter_by(username=session['user']).first()

@notes_bp.route('/')
def notes():
    """Render notes page with user's notes only"""
    current_user = get_current_user()
    if not current_user:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    # Only get notes belonging to current user
    user_notes = Note.query.filter_by(user_id=current_user.id).order_by(Note.created_at.desc()).all()
    return render_template('notes.html', notes=user_notes, current_user_id=current_user.id)

@notes_bp.route('/create', methods=['POST'])
def create_note():
    """Create a new note for current user"""
    current_user = get_current_user()
    if not current_user:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    title = request.form.get('title')
    content = request.form.get('content')

    if not title or not content:
        return jsonify({'success': False, 'error': 'Title and content are required'}), 400

    try:
        note = Note(
            title=title,
            content=content,
            created_at=datetime.now(),
            user_id=current_user.id
        )

        db.session.add(note)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Note created successfully',
            'note': {
                'id': note.id,
                'title': note.title,
                'content': note.content,
                'created_at': note.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'user_id': note.user_id
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@notes_bp.route('/search')
def search_notes():
    """Search only current user's notes"""
    current_user = get_current_user()
    if not current_user:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    query = request.args.get('q', '')
    
    try:
        # Use SQLAlchemy ORM with filter conditions
        notes = Note.query.filter(
            Note.user_id == current_user.id,
            (Note.title.ilike(f'%{query}%') | Note.content.ilike(f'%{query}%'))
        ).order_by(Note.created_at.desc()).all()

        notes_list = []
        for note in notes:
            notes_list.append({
                'id': note.id,
                'title': note.title,
                'content': note.content,
                'created_at': note.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'user_id': note.user_id
            })

        return jsonify({
            'success': True,
            'notes': notes_list
        })
    except Exception as e:
        print(f"Search error: {str(e)}")  # Add logging for debugging
        return jsonify({'success': False, 'error': str(e)}), 500


@notes_bp.route('/delete/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    """Delete note only if it belongs to current user"""
    current_user = get_current_user()
    if not current_user:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    try:
        note = Note.query.filter_by(id=note_id, user_id=current_user.id).first()
        if not note:
            return jsonify({'success': False, 'error': 'Note not found or unauthorized'}), 404

        db.session.delete(note)
        db.session.commit()

        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@notes_bp.route('/debug')
def debug_database():
    """Debug route to check database contents"""
    try:
        users = User.query.all()
        print("\nAll Users:")
        for user in users:
            print(f"ID: {user.id}, Username: {user.username}")

        notes = Note.query.all()
        print("\nAll Notes:")
        for note in notes:
            print(f"ID: {note.id}, Title: {note.title}, User ID: {note.user_id}")

        sql = text("SELECT * FROM notes")
        result = db.session.execute(sql)
        rows = result.fetchall()
        print("\nRaw SQL Notes Query Result:")
        for row in rows:
            print(row)

        return jsonify({
            'users': [{'id': u.id, 'username': u.username} for u in users],
            'notes': [note.to_dict() for note in notes]
        })
    except Exception as e:
        print(f"Debug Error: {e}")
        return jsonify({'error': str(e)}), 500
