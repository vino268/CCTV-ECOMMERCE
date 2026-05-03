const http = require('http');

async function testAuth() {
  console.log("1. Logging in...");
  const loginRes = await fetch("http://127.0.0.1:3000/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@gmail.com", password: "admin" }) // Use a dummy password, might fail if wrong, let's just see what happens
  });

  console.log("Login status:", loginRes.status);
  const loginData = await loginRes.json();
  console.log("Login data:", loginData);

  const cookies = loginRes.headers.get("set-cookie");
  console.log("Set-Cookie header:", cookies);

  if (cookies) {
    console.log("\n2. Fetching profile with cookie...");
    const profileRes = await fetch("http://127.0.0.1:3000/api/admin/profile", {
      headers: {
        "cookie": cookies.split(';')[0] // Just take the first part
      }
    });

    console.log("Profile status:", profileRes.status);
    const profileData = await profileRes.json();
    console.log("Profile data:", profileData);
  }
}

testAuth().catch(console.error);
