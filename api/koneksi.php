<?php
$host = "localhost";
$user = "tsaqif_db";
$pass = "Tsaqif123!";
$db   = "db_smoke_detector";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Koneksi database gagal: " . $conn->connect_error);
}
?>