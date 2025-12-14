
const base = 'http://localhost:3000';

async function testClassify() {
  console.log('Testing /api/classify with small payload');
  try {
    const res = await fetch(`${base}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image: 'test', mimeType: 'image/jpeg' })
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Error calling /api/classify:', err);
  }
}

async function testChat() {
  console.log('Testing /api/chat');
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: [], newMessage: 'What is the difference between cattle and buffalo?' })
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Error calling /api/chat:', err);
  }
}
    
async function testHealth() {
  console.log('Testing /api/health');
  try {
    const res = await fetch(`${base}/api/health`);
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error calling /api/health:', err);
  }
}

(async () => {
  await testHealth();
  await testClassify();
  await testChat();
})();