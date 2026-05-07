<?php
// settings cors
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// handle preflight options
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// connect db
$host = "localhost";
$user = "tsaqif_db";
$pass = "Tsaqif123!";
$dbname = "db_smoke_detector"; 

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Koneksi DB Gagal: " . $conn->connect_error]));
}

// handle POST request dari ESP32
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['nilai_asap'])) {
        $nilai = $conn->real_escape_string($_POST['nilai_asap']);

        // insert ke log_sensor
        $sql = "INSERT INTO log_sensor (nilai_asap) VALUES ('$nilai')";

        if ($conn->query($sql) === TRUE) {
            echo "Data berhasil masuk ke db_smoke_detector!";
        } else {
            echo "Error DB: " . $conn->error;
        }
    } else {
        echo "Parameter 'nilai_asap' tidak ditemukan!";
    }
    exit();
}

// handle GET request dari React (Butuh Token)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header("Content-Type: application/json");

    // tangkap header authorization
    $authHeader = null;
    if (isset($_SERVER['Authorization'])) {
        $authHeader = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $authHeader = trim($requestHeaders['Authorization']);
        }
    }

    // cek ketersediaan token
    if (empty($authHeader)) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Akses Ditolak! Token hilang."]);
        exit();
    }

    // ekstrak token
    $token = trim(str_replace('Bearer', '', $authHeader));

    // verifikasi token
    $stmt = $conn->prepare("SELECT id FROM users WHERE api_token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Akses Ditolak! Token tidak valid."]);
        exit();
    }

    $data_sensor = [];

    // ambil 10 data terbaru
    $sql = "SELECT * FROM log_sensor ORDER BY id DESC LIMIT 10";
    $result_data = $conn->query($sql);

    if ($result_data && $result_data->num_rows > 0) {
        while($row = $result_data->fetch_assoc()) {
            $data_sensor[] = $row;
        }
    }

    // kirim response JSON
    echo json_encode($data_sensor);
    exit();
}

$conn->close();
?>