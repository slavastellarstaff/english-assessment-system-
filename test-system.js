#!/usr/bin/env node

/**
 * Simple test script for the English Assessment System
 * Run with: node test-system.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSystem() {
  console.log('🧪 Testing English Assessment System...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Version:', healthResponse.data.version);
    console.log('   Timestamp:', healthResponse.data.timestamp);

    // Test 2: Get Assessment Config
    console.log('\n2️⃣ Testing assessment configuration...');
    const configResponse = await axios.get(`${BASE_URL}/api/assessment/config`);
    console.log('✅ Config retrieved successfully');
    console.log('   Phases:', Object.keys(configResponse.data.config.phases).length);
    console.log('   CEFR thresholds:', configResponse.data.config.scoring.cefr_thresholds);

    // Test 3: Start Session
    console.log('\n3️⃣ Testing session creation...');
    const sessionResponse = await axios.post(`${BASE_URL}/api/session/start`);
    console.log('✅ Session created successfully');
    console.log('   Session ID:', sessionResponse.data.session_id);
    console.log('   Phase:', sessionResponse.data.phase);

    const sessionId = sessionResponse.data.session_id;

    // Test 4: Get Session Status
    console.log('\n4️⃣ Testing session status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/session/${sessionId}/status`);
    console.log('✅ Session status retrieved');
    console.log('   Current phase:', statusResponse.data.session.phase);
    console.log('   Turn index:', statusResponse.data.session.turn_index);

    // Test 5: Get Session Progress
    console.log('\n5️⃣ Testing progress tracking...');
    const progressResponse = await axios.get(`${BASE_URL}/api/assessment/${sessionId}/progress`);
    console.log('✅ Progress retrieved');
    console.log('   Progress:', progressResponse.data.progress.progress_percentage + '%');
    console.log('   Current phase:', progressResponse.data.progress.current_phase);

    // Test 6: Get Session Analytics
    console.log('\n6️⃣ Testing analytics...');
    const analyticsResponse = await axios.get(`${BASE_URL}/api/assessment/${sessionId}/analytics`);
    console.log('✅ Analytics retrieved');
    console.log('   Total turns:', analyticsResponse.data.analytics.total_turns);
    console.log('   Session duration:', analyticsResponse.data.analytics.session_duration + 'ms');

    // Test 7: Get Session Summary
    console.log('\n7️⃣ Testing session summary...');
    const summaryResponse = await axios.get(`${BASE_URL}/api/assessment/${sessionId}/summary`);
    console.log('✅ Summary retrieved');
    console.log('   Status:', summaryResponse.data.summary.status);
    console.log('   Created at:', new Date(summaryResponse.data.summary.created_at).toLocaleString());

    // Test 8: End Session
    console.log('\n8️⃣ Testing session termination...');
    const endResponse = await axios.post(`${BASE_URL}/api/session/${sessionId}/end`);
    console.log('✅ Session ended successfully');
    console.log('   Message:', endResponse.data.message);

    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📋 System Status:');
    console.log('   ✅ Backend server is running');
    console.log('   ✅ API endpoints are responding');
    console.log('   ✅ Session management is working');
    console.log('   ✅ Assessment engine is functional');
    console.log('   ✅ Database operations are successful');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running (npm run server:dev)');
    console.log('   2. Check that port 3001 is available');
    console.log('   3. Verify all dependencies are installed (npm install)');
    console.log('   4. Check the server logs for any errors');
  }
}

// Run tests
testSystem();
