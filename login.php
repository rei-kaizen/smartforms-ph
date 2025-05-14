<?php
    define('DB_SERVER',   'localhost');
    define('DB_USERNAME', 'root');
    define('DB_PASSWORD', '');
    define('DB_NAME', 'tts_db');

    $con = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

    if (!$con) {
        die("Connection failed: " . mysqli_connect_error());
    }

    // Set content type to JSON for all responses
    header('Content-Type: application/json');

    // Function to sanitize input
    function sanitizeInput($conn, $input) {
        return mysqli_real_escape_string($conn, trim($input));
    }

    // Function to generate standardized response
    function sendResponse($success, $message, $data = null) {
        $response = [
            'success' => $success,
            'message' => $message
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        echo json_encode($response);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get JSON data or form data
        $postData = file_get_contents('php://input');
        $jsonData = json_decode($postData, true);
        
        // If JSON failed, use POST data
        if ($jsonData === null) {
            $username = isset($_POST['username']) ? sanitizeInput($con, $_POST['username']) : '';
            $password = isset($_POST['password']) ? sanitizeInput($con, $_POST['password']) : '';
        } else {
            $username = isset($jsonData['username']) ? sanitizeInput($con, $jsonData['username']) : '';
            $password = isset($jsonData['password']) ? sanitizeInput($con, $jsonData['password']) : '';
        }
        
        // Validate required fields
        if (empty($username) || empty($password)) {
            sendResponse(false, 'Username and password are required');
        }
        
        // Prevent SQL injection by using prepared statements
        $stmt = $con->prepare("SELECT * FROM user WHERE preferred_user_id=? AND password=?");
        
        if (!$stmt) {
            sendResponse(false, 'Database error: ' . $con->error);
        }
        
        // Bind parameters and execute
        $stmt->bind_param("ss", $username, $password);  // NOTE: In production, use password_hash() and password_verify()
        $stmt->execute();
        
        // Get result
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            
            // Create session
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['preferred_user_id'];
            
            // Return user data (except password)
            unset($user['password']);
            sendResponse(true, 'Login successful', $user);
        } else {
            sendResponse(false, 'Invalid username or password');
        }
    } else {
        sendResponse(false, 'Invalid request method. Please use POST');
    }
    
    mysqli_close($con);
?>