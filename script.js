// LOGIN
function login() {
    const usernameVal = document.getElementById("username").value;
    const passwordVal = document.getElementById("password").value;

    fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: usernameVal,
            password: passwordVal
        })
    })
    .then(res => res.text())
    .then(data => {
        if (data === "Login Success") {
            localStorage.setItem("username", usernameVal);
            window.location.href = "chat.html";
        } else {
            alert(data);
        }
    });
}

// REGISTER
function register() {
    const usernameVal = document.getElementById("username").value;
    const passwordVal = document.getElementById("password").value;

    fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: usernameVal,
            password: passwordVal
        })
    })
    .then(res => res.text())
    .then(data => alert(data));
}


// CHAT
if (window.location.pathname.includes("chat.html")) {

    const socket = io();
    const username = localStorage.getItem("username");

    const msgInput = document.getElementById("msg");
    const messagesDiv = document.getElementById("messages");

    socket.emit("join", username);

    // LOAD OLD
    fetch("/messages")
    .then(res => res.json())
    .then(data => {
        data.forEach(msg => addMessage(msg.username, msg.message));
    });

    // SEND
    window.sendMessage = function () {
        const message = msgInput.value;

        if (message.trim() === "") return;

        console.log("Sending:", message);

        socket.emit("sendMessage", {
            username: username,
            message: message
        });

        msgInput.value = "";
    };

    // RECEIVE
    socket.on("receiveMessage", (data) => {
        console.log("Received:", data);
        addMessage(data.username, data.message);
    });

    function addMessage(user, message) {
        const div = document.createElement("div");
        div.innerText = user + ": " + message;
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}