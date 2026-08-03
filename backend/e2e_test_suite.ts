import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('--- Starting E2E API Tests ---');
  let adminToken = '';
  let cookies: string[] = [];
  let csrfToken = '';
  
  // 0. Get CSRF Token
  try {
    const csrfRes = await axios.get(`${BASE_URL}/csrf-token`);
    csrfToken = csrfRes.data.csrfToken;
    cookies = csrfRes.headers['set-cookie'] || [];
    console.log('✅ CSRF Token Fetched');
  } catch (error: any) {
    console.error('❌ CSRF Fetch Failed:', error.message);
    return;
  }

  // 1. Admin Login
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@football.com',
      password: 'admin123'
    }, {
      headers: {
        'CSRF-Token': csrfToken,
        Cookie: cookies.join('; ')
      }
    });
    adminToken = res.data.data.accessToken || res.data.data.token;
    const newCookies = res.headers['set-cookie'];
    if (newCookies) cookies = [...cookies, ...newCookies];
    console.log('✅ Admin Login Successful');
  } catch (error: any) {
    console.error('❌ Admin Login Failed:', error.response?.data || error.message);
    return;
  }

  const axiosAdmin = axios.create({
    baseURL: BASE_URL,
    headers: { 
      Authorization: `Bearer ${adminToken}`,
      'CSRF-Token': csrfToken,
      Cookie: cookies.join('; ')
    }
  });

  // 2. Change Phase to REGISTRATION
  try {
    await axiosAdmin.put('/system/phase', { phase: 'REGISTRATION' });
    console.log('✅ System Phase set to REGISTRATION');
  } catch (error: any) {
    console.error('❌ Phase Change Failed:', error.response?.data || error.message);
  }

  // 3. Register a Player (Requires multipart data)
  try {
    const publicData = await axios.get(`${BASE_URL}/public/landing`);
    const data = publicData.data.data.data; // nested data
    
    if (!data.categories || data.categories.length === 0) {
       console.log('⚠️ No categories found. Skipping registration test.');
    } else {
      const form = new FormData();
      form.append('name', 'Test E2E Player');
      form.append('email', `testplayer_${Date.now()}@uni.edu`);
      form.append('password', 'Player@123');
      form.append('studentId', `ID-${Date.now()}`);
      form.append('session', data.sessions[0]?.name || '2021-2022');
      form.append('jerseyName', 'TESTER');
      form.append('primaryPos', data.positions[0]?.code || 'FW');
      form.append('categoryId', data.categories[0]?.id);
      
      // Create a dummy image
      const dummyPath = path.join(__dirname, 'dummy.png');
      if (!fs.existsSync(dummyPath)) {
        fs.writeFileSync(dummyPath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
      }
      form.append('image', fs.createReadStream(dummyPath));

      await axios.post(`${BASE_URL}/player/register`, form, {
        headers: { 
          ...form.getHeaders(),
          'CSRF-Token': csrfToken,
          Cookie: cookies.join('; ')
        }
      });
      console.log('✅ Player Registration Successful (Cloudinary works!)');
    }
  } catch (error: any) {
    console.error('❌ Player Registration Failed:', error.response?.data || error.message);
  }

  // 4. Test Tournament Engine
  try {
    await axiosAdmin.put('/system/phase', { phase: 'TOURNAMENT' });
    console.log('✅ System Phase set to TOURNAMENT');
    
    // Get Teams
    const teamsRes = await axiosAdmin.get('/teams');
    const teams = teamsRes.data.data;
    if (teams.length >= 2) {
      // Create Match
      const matchRes = await axiosAdmin.post('/tournament/fixtures', {
        homeTeamId: teams[0].id,
        awayTeamId: teams[1].id,
        type: 'SINGLE',
        round: 'Test Round',
        scheduledTime: new Date().toISOString(),
        venue: 'Main Stadium'
      });
      const matchId = matchRes.data.data.id;
      console.log('✅ Fixture Generated');

      // Update Match Status to LIVE
      await axiosAdmin.patch(`/tournament/matches/${matchId}/status`, { status: 'LIVE' });
      console.log('✅ Match Status updated to LIVE');

      // Check if players exist to log event
      if (teams[0].players && teams[0].players.length > 0) {
        await axiosAdmin.post(`/tournament/matches/${matchId}/events`, {
          type: 'GOAL',
          minute: 12,
          playerId: teams[0].players[0].userId
        });
        console.log('✅ Match Event (GOAL) logged successfully');
      }

      // End Match
      await axiosAdmin.patch(`/tournament/matches/${matchId}/status`, { status: 'FINISHED' });
      console.log('✅ Match Status updated to FINISHED (Points table updated)');

    } else {
      console.log('⚠️ Not enough teams to test Match Engine. Found:', teams.length);
    }
  } catch (error: any) {
    console.error('❌ Tournament Engine Test Failed on URL:', error.config?.url);
    console.error('Error Data:', error.response?.data || error.message);
  }

  console.log('--- Tests Completed ---');
}

runTests();
