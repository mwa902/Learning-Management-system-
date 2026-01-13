
const SUPABASE_URL = "https://eymsxizmkiteggxakfpc.supabase.co";
const SUPABASE_KEY = "sb_publishable_hUxdhiQdpIuxeFUpFO2ueg_z7YCSmKg";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase Client Initialized');
alert('System Check: Javascript is RUNNING. You should be able to login/signup.');

document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // STOP page reload
            console.log('Login Submit Detected');

            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;
            const messageEl = document.getElementById('loginMessage');

            messageEl.textContent = 'Logging in...';
            messageEl.style.color = 'blue';

            try {
                // Query the user_auth table
                const { data, error } = await supabaseClient
                    .from('user_auth')
                    .select('*')
                    .eq('username', usernameInput)
                    .eq('password_hash', passwordInput)
                    .single();

                if (error || !data) {
                    console.error('Login error:', error);
                    messageEl.textContent = 'Invalid username or password';
                    messageEl.style.color = 'red';
                    alert('Login Failed: Invalid username or password');
                    return;
                }

                // Login successful
                messageEl.textContent = 'Login successful! Redirecting...';
                messageEl.style.color = 'green';

                // Store session info
                sessionStorage.setItem('student_id', data.student_id);
                sessionStorage.setItem('user_role', data.role);
                sessionStorage.setItem('username', data.username);

                setTimeout(() => {
                    if (data.role === 'Admin') {
                        window.location.href = 'Admin/admin_dashboard.html';
                    } else {
                        window.location.href = 'Hub/hubpage.html';
                    }
                }, 1000);

            } catch (err) {
                console.error('Unexpected Login Error:', err);
                messageEl.textContent = 'Error: ' + err.message;
            }
        });
    }

    // --- SIGNUP LOGIC ---
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // STOP page reload
            console.log('Signup Submit Detected');

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const program = document.getElementById('program').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const messageEl = document.getElementById('signupMessage');

            messageEl.textContent = 'Creating account...';
            messageEl.style.color = 'blue';

            try {
                // --- TRIGGER BYPASS FIX ---
                // Problem: The database trigger might be causing collisions if it just uses the Name for creation.
                // Solution: Insert with UNIQUE temporary name -> Update to Real Name -> Update Credentials

                messageEl.textContent = 'Initializing secure registration...';

                // 1. Generate Unique ID and Temp Name to satisfy any trigger logic
                const newStudentId = Math.floor(Math.random() * 90000) + 1000;
                // "TempUser_1234_987654321" is extremely unlikely to collide
                const tempUniqueName = `TempUser_${newStudentId}_${Date.now()}`;

                // 2. Insert Student with TEMP NAME
                const { error: studentError } = await supabaseClient
                    .from('student')
                    .insert([
                        {
                            student_id: newStudentId,
                            name: tempUniqueName,
                            email: email,
                            phone_no: phone,
                            program: program,
                            batch: 2025,
                            semester: 1,
                            age: 18
                        }
                    ]);

                if (studentError) {
                    console.error('Student Insert Error:', studentError);
                    if (studentError.code === '23505') {
                        throw new Error('System busy, please click Sign Up again.');
                    }
                    throw new Error('Error creating student record: ' + studentError.message);
                }

                // 3. Update Student Name to REAL Name
                messageEl.textContent = 'Finalizing profile...';
                const { error: updateNameError } = await supabaseClient
                    .from('student')
                    .update({ name: name })
                    .eq('student_id', newStudentId);

                if (updateNameError) {
                    console.error('Name Update Error:', updateNameError);
                }

                // 4. Update or Insert Credentials
                messageEl.textContent = 'Setting credentials...';

                // We try to UPDATE the trigger-created record first
                const { data: updatedUser, error: authError } = await supabaseClient
                    .from('user_auth')
                    .update({
                        username: username,
                        password_hash: password
                    })
                    .eq('student_id', newStudentId)
                    .select();

                if (authError || !updatedUser || updatedUser.length === 0) {
                    // Check for username collision on the UPDATE itself
                    if (authError && authError.code === '23505') {
                        throw new Error('Username already taken. Please choose another.');
                    }

                    console.log('Trigger record not accessible, performing manual setup...');

                    // Manual Insert Fallback
                    const { error: manualError } = await supabaseClient
                        .from('user_auth')
                        .insert([{
                            student_id: newStudentId,
                            username: username,
                            password_hash: password,
                            role: 'Student'
                        }]);

                    if (manualError) {
                        if (manualError.code === '23505') {
                            throw new Error('Username already taken. Please choose another.');
                        }
                        throw new Error('Could not set login credentials: ' + manualError.message);
                    }
                }

                messageEl.textContent = 'Success! Redirecting...';
                messageEl.style.color = 'green';
                alert('Account Created Successfully!');

                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);

            } catch (err) {
                console.error('Signup Failure Flow:', err);
                messageEl.textContent = 'Signup Failed: ' + err.message;
                messageEl.style.color = 'red';
                alert(err.message);
            }
        });
    }
});
