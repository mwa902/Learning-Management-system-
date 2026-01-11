
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
                // 1. Generate a random ID for the student
                const newStudentId = Math.floor(Math.random() * 90000) + 1000;

                // 2. Insert into STUDENT table with new fields and defaults
                const { error: studentError } = await supabaseClient
                    .from('student')
                    .insert([
                        {
                            student_id: newStudentId,
                            name: name,
                            email: email,
                            phone_no: phone,
                            program: program,
                            batch: 2025,
                            semester: 1,
                            age: 18 // Default age
                        }
                    ]);

                if (studentError) {
                    throw new Error('Error creating student: ' + studentError.message);
                }

                // 3. Update the automatically created user_auth entry
                // Wait small delay to ensure trigger fired (rarely needed but safe)
                // await new Promise(r => setTimeout(r, 500)); 

                const { data: updatedUser, error: authError } = await supabaseClient
                    .from('user_auth')
                    .update({
                        username: username,
                        password_hash: password
                    })
                    .eq('student_id', newStudentId)
                    .select();

                if (authError) {
                    throw new Error('Error setting credentials: ' + authError.message);
                }

                if (!updatedUser || updatedUser.length === 0) {
                    throw new Error('Account created but could not set password. Check RLS policies or try default hash.');
                }

                messageEl.textContent = 'Account created! Redirecting...';
                messageEl.style.color = 'green';
                alert('Account Created Successfully!');

                setTimeout(() => {
                    window.location.href = 'loginpage.html';
                }, 1500);

            } catch (err) {
                console.error('Signup error:', err);
                messageEl.textContent = 'Signup Failed: ' + err.message;
                messageEl.style.color = 'red';
                alert('Signup Failed: ' + err.message);
            }
        });
    }
});
