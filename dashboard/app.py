#!/usr/bin/env python3
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from datetime import datetime, timedelta
import os
import json
import requests
from functools import wraps
import logging

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'ignite-development-key')

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
OKTA_DOMAIN = os.environ.get('OKTA_DOMAIN', 'flosports.okta.com')
OKTA_API_TOKEN = os.environ.get('OKTA_API_TOKEN', '')
JIRA_DOMAIN = os.environ.get('JIRA_DOMAIN', 'flosports.atlassian.net')
JIRA_API_TOKEN = os.environ.get('JIRA_API_TOKEN', '')
JIRA_EMAIL = os.environ.get('JIRA_EMAIL', 'ignite_admin@flosports.tv')
CONTRACTOR_PROJECT = os.environ.get('CONTRACTOR_PROJECT', 'CONTR')

# Simplified mock data storage for demo purposes
# In production, this would be a database
MOCK_DATA_FILE = 'mock_data.json'

def load_mock_data():
    try:
        if os.path.exists(MOCK_DATA_FILE):
            with open(MOCK_DATA_FILE, 'r') as f:
                return json.load(f)
        else:
            # Create default mock data
            data = {
                'pending_requests': [
                    {
                        'first_name': 'Jane',
                        'last_name': 'Smith',
                        'email': 'jane.smith@unifycx.team',
                        'type': 'SRE',
                        'requested_date': (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'),
                        'ticket': 'CONTR-101'
                    },
                    {
                        'first_name': 'Alex',
                        'last_name': 'Johnson',
                        'email': 'alex.johnson@unifycx.com',
                        'type': 'DevOps',
                        'requested_date': datetime.now().strftime('%Y-%m-%d'),
                        'ticket': 'CONTR-102'
                    }
                ],
                'active_contractors': [
                    {
                        'id': '1',
                        'first_name': 'Michael',
                        'last_name': 'Brown',
                        'email': 'michael.brown@unifycx.team',
                        'type': 'SRE',
                        'start_date': (datetime.now() - timedelta(days=60)).strftime('%Y-%m-%d'),
                        'end_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
                        'days_left': 30,
                        'workspace_id': 'ws-abcdef123'
                    },
                    {
                        'id': '2',
                        'first_name': 'Sarah',
                        'last_name': 'Lee',
                        'email': 'sarah.lee@unifycx.com',
                        'type': 'Developer',
                        'start_date': (datetime.now() - timedelta(days=80)).strftime('%Y-%m-%d'),
                        'end_date': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
                        'days_left': 10,
                        'workspace_id': None
                    },
                    {
                        'id': '3',
                        'first_name': 'David',
                        'last_name': 'Wilson',
                        'email': 'david.wilson@unifycx.team',
                        'type': 'SRE',
                        'start_date': (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d'),
                        'end_date': (datetime.now() + timedelta(days=85)).strftime('%Y-%m-%d'),
                        'days_left': 85,
                        'workspace_id': 'ws-xyz789'
                    }
                ]
            }
            save_mock_data(data)
            return data
    except Exception as e:
        logger.error(f"Error loading mock data: {e}")
        return {'pending_requests': [], 'active_contractors': []}

def save_mock_data(data):
    try:
        with open(MOCK_DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving mock data: {e}")

# Simple auth middleware for demo purposes
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # In a real application, check session or token
        # For demo, we're allowing all access
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
@login_required
def index():
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/contractors')
@login_required
def contractors():
    data = load_mock_data()
    return render_template('contractors.html', 
                          pending_requests=data['pending_requests'], 
                          active_contractors=data['active_contractors'])

@app.route('/approve_contractor', methods=['POST'])
@login_required
def approve_contractor():
    ticket_id = request.form.get('ticket_id')
    
    # In production, this would call the actual Okta and Jira APIs
    # For demo, we'll just move from pending to active
    data = load_mock_data()
    
    for idx, req in enumerate(data['pending_requests']):
        if req['ticket'] == ticket_id:
            # Create new active contractor
            new_contractor = {
                'id': str(len(data['active_contractors']) + 1),
                'first_name': req['first_name'],
                'last_name': req['last_name'],
                'email': req['email'],
                'type': req['type'],
                'start_date': datetime.now().strftime('%Y-%m-%d'),
                'end_date': (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d'),
                'days_left': 90,
                'workspace_id': 'ws-' + req['email'].split('@')[0] if req['type'] == 'SRE' else None
            }
            
            data['active_contractors'].append(new_contractor)
            data['pending_requests'].pop(idx)
            save_mock_data(data)
            
            flash(f"Contractor {new_contractor['first_name']} {new_contractor['last_name']} approved successfully!", "success")
            
            # In production, trigger the AWS WorkSpace creation for SRE contractors
            if req['type'] == 'SRE':
                logger.info(f"Would create AWS WorkSpace for {req['email']}")
                # This would call a Cloud Function to create the workspace
            
            break
    
    return redirect(url_for('contractors'))

@app.route('/extend_contractor', methods=['POST'])
@login_required
def extend_contractor():
    contractor_id = request.form.get('contractor_id')
    extension_days = int(request.form.get('extension_days', 90))
    reason = request.form.get('reason')
    
    data = load_mock_data()
    
    for contractor in data['active_contractors']:
        if contractor['id'] == contractor_id:
            # Update end date
            current_end = datetime.strptime(contractor['end_date'], '%Y-%m-%d')
            new_end = current_end + timedelta(days=extension_days)
            contractor['end_date'] = new_end.strftime('%Y-%m-%d')
            contractor['days_left'] = (new_end - datetime.now()).days
            save_mock_data(data)
            
            logger.info(f"Extended contractor {contractor['email']} by {extension_days} days. Reason: {reason}")
            flash(f"Extended access for {contractor['first_name']} {contractor['last_name']} by {extension_days} days.", "success")
            break
    
    return redirect(url_for('contractors'))

@app.route('/terminate_contractor', methods=['POST'])
@login_required
def terminate_contractor():
    contractor_id = request.form.get('contractor_id')
    reason = request.form.get('reason')
    
    data = load_mock_data()
    
    for idx, contractor in enumerate(data['active_contractors']):
        if contractor['id'] == contractor_id:
            # In production, this would:
            # 1. Call Okta API to remove user from groups and deactivate
            # 2. Call AWS API to terminate WorkSpace if exists
            # 3. Update records in database
            
            logger.info(f"Terminating contractor {contractor['email']}. Reason: {reason}")
            
            # For demo, just remove from the list
            terminated = data['active_contractors'].pop(idx)
            save_mock_data(data)
            
            flash(f"Terminated access for {terminated['first_name']} {terminated['last_name']}.", "warning")
            break
    
    return redirect(url_for('contractors'))

@app.route('/api/contractors', methods=['GET'])
@login_required
def api_contractors():
    data = load_mock_data()
    return jsonify(data)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)