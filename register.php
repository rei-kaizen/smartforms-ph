<?php
    define('DB_SERVER', 'localhost');
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
        try {
            // Sanitize user input
            $username = isset($_POST['username']) ? sanitizeInput($con, $_POST['username']) : '';
            $email = isset($_POST['email']) ? sanitizeInput($con, $_POST['email']) : '';
            $password = isset($_POST['password']) ? sanitizeInput($con, $_POST['password']) : '';
            $lastName = isset($_POST['lastName']) ? sanitizeInput($con, $_POST['lastName']) : '';
            $firstName = isset($_POST['firstName']) ? sanitizeInput($con, $_POST['firstName']) : '';
            $middleName = isset($_POST['middleName']) ? sanitizeInput($con, $_POST['middleName']) : '';
            $phone = isset($_POST['phone']) ? sanitizeInput($con, $_POST['phone']) : '';
            $suffix = isset($_POST['suffix']) ? sanitizeInput($con, $_POST['suffix']) : '';
            $select_region = isset($_POST['select_region']) ? sanitizeInput($con, $_POST['select_region']) : '';
            $region_province = isset($_POST['region_province']) ? sanitizeInput($con, $_POST['region_province']) : '';
            $province_cities = isset($_POST['province_cities']) ? sanitizeInput($con, $_POST['province_cities']) : '';
            $cities_barangay = isset($_POST['cities_barangay']) ? sanitizeInput($con, $_POST['cities_barangay']) : '';
            $zip = isset($_POST['zip']) ? sanitizeInput($con, $_POST['zip']) : '';
            $street = isset($_POST['street']) ? sanitizeInput($con, $_POST['street']) : '';
            $building = isset($_POST['building']) ? sanitizeInput($con, $_POST['building']) : '';

            // Validate required fields
            $requiredFields = [
                'email' => $email,
                'username' => $username,
                'password' => $password,
                'lastName' => $lastName,
                'firstName' => $firstName,
                'phone' => $phone,
                'select_region' => $select_region,
                'province_cities' => $province_cities,
                'cities_barangay' => $cities_barangay,
                'zip' => $zip
            ];

            foreach ($requiredFields as $field => $value) {
                if (empty($value)) {
                    sendResponse(false, "Field '$field' is required");
                }
            }

            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendResponse(false, "Invalid email format");
            }

            // Check if email already exists
            $stmt = $con->prepare("SELECT id FROM user WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $stmt->store_result();
            if ($stmt->num_rows > 0) {
                sendResponse(false, "Email already registered");
            }
            $stmt->close();

            // Check if username already exists
            $stmt = $con->prepare("SELECT id FROM user WHERE preferred_user_id = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $stmt->store_result();
            if ($stmt->num_rows > 0) {
                sendResponse(false, "Username already taken");
            }
            $stmt->close();

            // Generate a unique CRN (Customer Reference Number)
            $crn = 'TTS-' . time() . '-' . rand(1000, 9999);
            
            // In production, use password_hash()
            // $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Insert into database using prepared statement
            $stmt = $con->prepare("
                INSERT INTO user (
                    crn, email, preferred_user_id, password, last_name, first_name, 
                    middle_name, suffix, mailing_philippines, province, city, 
                    barangay, postal, mailing_foreign
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
            ");

            $mailing_foreign = $building . ' ' . $street;
            
            $stmt->bind_param(
                "ssssssssssssss",
                $crn, $email, $username, $password, $lastName, $firstName,
                $middleName, $suffix, $select_region, $region_province,
                $province_cities, $cities_barangay, $zip, $mailing_foreign
            );

            if ($stmt->execute()) {
                // Success - redirect to login page
                sendResponse(true, "Registration successful", ["redirect" => "login.html"]);
            } else {
                sendResponse(false, "Database error: " . $stmt->error);
            }
            
            $stmt->close();
        } catch (Exception $e) {
            sendResponse(false, "Server error: " . $e->getMessage());
        }
    } else {
        sendResponse(false, "Invalid request method. Please use POST");
    }

    mysqli_close($con);
?>