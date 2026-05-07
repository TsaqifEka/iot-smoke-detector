<?php
// connect db
$host = "localhost";
$user = "tsaqif_db";
$pass = "Tsaqif123!";
$dbname = "db_smoke_detector";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}

// setup admin credentials
$username = "admin";
$password_asli = "rahasia123!";
$password_hash = password_hash($password_asli, PASSWORD_DEFAULT);

// insert to database
$sql = "INSERT INTO users (username, password) VALUES ('$username', '$password_hash')";

if ($conn->query($sql) === TRUE) {
    echo "<h1>SUKSES!</h1>";
    echo "Akun Admin berhasil dibuat.<br>";
    echo "Username: <b>$username</b><br>";
    echo "Password: <b>$password_asli</b><br>";
    echo "<br><i>WARNING: Segera hapus file setup_admin.php ini dari server production demi keamanan!</i>";
} else {
    echo "Error: " . $conn->error;
}

$conn->close();
?>