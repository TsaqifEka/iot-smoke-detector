<?php
// settings cors
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// handle preflight options
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

// handle errors
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // connect db
    $conn = new mysqli("localhost", "root", "Tsaqif123!", "db_smoke_detector");

    if ($conn->connect_error) {
        throw new Exception("Koneksi DB Gagal: " . $conn->connect_error);
    }

    // get request data
    $inputJSON = file_get_contents("php://input");
    $data = json_decode($inputJSON);

    if (!$data || !isset($data->username) || !isset($data->password)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Username dan Password kosong!"]);
        exit();
    }

    $username = $conn->real_escape_string($data->username);
    $password = $data->password;

    // find user
    $result = $conn->query("SELECT id, password FROM users WHERE username = '$username'");

    if (!$result) {
        throw new Exception("Error Tabel Database: " . $conn->error);
    }

    // verify password
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();

        if (password_verify($password, $row['password'])) {
            $token = bin2hex(random_bytes(32));
            $user_id = $row['id'];

            if (!$conn->query("UPDATE users SET api_token = '$token' WHERE id = $user_id")) {
                 throw new Exception("Gagal membuat token: " . $conn->error);
            }

            echo json_encode([
                "status" => "success",
                "message" => "Login berhasil",
                "token" => $token
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Password yang dimasukkan salah!"]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Username tidak ditemukan di sistem!"]);
    }

    $conn->close();

} catch (Exception $e) {
    // catch exceptions
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Sistem Error: " . $e->getMessage()]);
}
?>