
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the form from submitting normally

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:4000/Users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('message').textContent = data.message;
            document.getElementById('message').style.color = 'green';
        } else {
            document.getElementById('message').textContent = data.message || 'Registration failed!';
            document.getElementById('message').style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'Something went wrong. Please try again.';
        document.getElementById('message').style.color = 'red';
    }
});
