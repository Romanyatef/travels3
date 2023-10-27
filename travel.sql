-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 27, 2023 at 10:35 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `travel`
--

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `companyName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contactus`
--

CREATE TABLE `contactus` (
  `id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `userName` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contactus`
--

INSERT INTO `contactus` (`id`, `userid`, `userName`, `phone`, `email`, `subject`) VALUES
(3, 6, 'روماني عاطف عطيه', '+201223958299', 'romany@gmail.com', 'تىشيهخىخرىخىصصهثخىخصثرىخصثىخصثاخ'),
(4, 6, 'روماني عاطف عطيه', '+201223958299', 'romany@gmail.com', 'تىشيهخىخرىخىصصهثخىخصثرىخصثىخصثاخ'),
(5, 6, 'روماني عاطف عطيه', '+201223958299', 'romany@gmail.com', 'تىشيهخىخرىخىصصهثخىخصثرىخصثىخصثاخ'),
(6, 6, 'روماني عاطف عطيه', '+201223958299', 'romany@gmail.com', 'تىشيهخىخرىخىصصهثخىخصثرىخصثىخصثاخ'),
(7, 6, 'روماني عاطف عطيه', '+201223958299', 'romany@gmail.com', 'تىشيهخىخرىخىصصهثخىخصثرىخصثىخصثاخ'),
(8, 6, 'روماني عاطف عطيه', '+201223958299', 'romany@gmail.com', 'تىشيهخىخرىخىصصهثخىخصثرىخصثىخصثاخ'),
(9, 6, 'روماني عاطف عطيه', '+201223958299', 'romany@gmail.com', 'تىشيهخىخرىخىصصهثخىخصثرىخصثىخصثاخ'),
(10, 6, 'روماني عاطف عطيه', '+201223958299', 'romany@gmail.com', 'تىشيهخىخرىخىصصهثخىخصثرىخصثىخصثاخ'),
(11, 6, 'روماني عاطف عطيه', '+201223958299', 'romany@gmail.com', 'تىشيهخىخرىخىصصهثخىخصثرىخصثىخصثاخ'),
(12, 6, 'روماني عاطف عطيه', '+201223958299', 'romany@gmail.com', 'تىشيهخىخرىخىصصهثخىخصثرىخصثىخصثاخ');

-- --------------------------------------------------------

--
-- Table structure for table `creditcard`
--

CREATE TABLE `creditcard` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `cnnNumber` int(11) NOT NULL,
  `cvv` int(11) NOT NULL,
  `type` varchar(255) NOT NULL,
  `userID` int(11) NOT NULL,
  `exprity` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `creditcard`
--

INSERT INTO `creditcard` (`id`, `name`, `cnnNumber`, `cvv`, `type`, `userID`, `exprity`) VALUES
(8, 'visa', 298829, 242235, '', 6, '2000-03-20');

-- --------------------------------------------------------

--
-- Table structure for table `driver`
--

CREATE TABLE `driver` (
  `id` int(11) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `mobileNumber` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `emailAddress` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `homeAddress` varchar(255) NOT NULL,
  `dateOfBirth` date NOT NULL,
  `emiratesID` varchar(255) NOT NULL,
  `profile_image` varchar(255) NOT NULL,
  `passport` varchar(255) NOT NULL,
  `residenceVisa` varchar(255) NOT NULL,
  `drivingLicense` varchar(255) NOT NULL,
  `carLicense` varchar(255) NOT NULL,
  `tradeLicense` varchar(255) NOT NULL,
  `joiningDate` date DEFAULT NULL,
  `gender` int(1) NOT NULL COMMENT '1=>male\r\n0=>Female',
  `individualOrCorporate` int(1) NOT NULL COMMENT 'individual=>0\r\ncorporate=>1\r\n',
  `companyName` varchar(255) DEFAULT NULL,
  `status` int(1) NOT NULL DEFAULT 1 COMMENT '1=> active \r\n0=>inactive'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `driver`
--

INSERT INTO `driver` (`id`, `fullName`, `mobileNumber`, `token`, `emailAddress`, `password`, `homeAddress`, `dateOfBirth`, `emiratesID`, `profile_image`, `passport`, `residenceVisa`, `drivingLicense`, `carLicense`, `tradeLicense`, `joiningDate`, `gender`, `individualOrCorporate`, `companyName`, `status`) VALUES
(4, 'romany atef atia atia  ', '+201223958299', '3d1af9ae3a61f380b5183a9a21eb5789', 'romany@gmail.com', '$2b$10$MgoKM.DSVCddFfWhxfBDIO4YE1BZbmU3ShJNFKe1p.u25qtwhdsBe', 'cairo', '2001-03-31', '32832832828923898328', '1697792910292-589961089.jpg', '1697792910293-648135760.jpg', '1697792910295-117317556.jpg', '1697792910293-280416662.jpg', '1697792910296-624809063.jpg', '1697792910295-808891009.jpg', '2023-10-20', 1, 0, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `exceptiontrips`
--

CREATE TABLE `exceptiontrips` (
  `id` int(11) NOT NULL,
  `tripId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `day` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `externaltrips`
--

CREATE TABLE `externaltrips` (
  `id` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `tripID` int(11) NOT NULL,
  `counter` int(11) NOT NULL DEFAULT 2,
  `day` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `favaddress`
--

CREATE TABLE `favaddress` (
  `id` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `longitude` double NOT NULL,
  `latitude` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `favaddress`
--

INSERT INTO `favaddress` (`id`, `userID`, `title`, `longitude`, `latitude`) VALUES
(3, 6, 'hello', 33.34434434343, 23.23999898899989);

-- --------------------------------------------------------

--
-- Table structure for table `maintenance`
--

CREATE TABLE `maintenance` (
  `id` int(11) NOT NULL,
  `vehicleID` int(11) NOT NULL,
  `content` varchar(255) NOT NULL,
  `withHow` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nationalities`
--

CREATE TABLE `nationalities` (
  `id` int(11) NOT NULL,
  `nationalityAR` varchar(255) NOT NULL,
  `nationalityEN` varchar(255) NOT NULL,
  `countryCode` varchar(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nationalities`
--

INSERT INTO `nationalities` (`id`, `nationalityAR`, `nationalityEN`, `countryCode`) VALUES
(1, 'مصر', 'egypt', '+2'),
(4, 'المغرب', 'moroco', '+212'),
(7, 'ليبيا', 'libya', '+972');

-- --------------------------------------------------------

--
-- Table structure for table `otpstoring`
--

CREATE TABLE `otpstoring` (
  `id` int(11) NOT NULL,
  `masterkey` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `qrcodes`
--

CREATE TABLE `qrcodes` (
  `id` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `qrcodetext` varchar(255) NOT NULL,
  `present` int(1) DEFAULT NULL COMMENT '1==>check in \r\nelse deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `qrcodes`
--

INSERT INTO `qrcodes` (`id`, `userID`, `qrcodetext`, `present`) VALUES
(2, 6, 'cbdfd16b-4e55-4181-9512-c4d7c440573f', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stations`
--

CREATE TABLE `stations` (
  `id` int(11) NOT NULL,
  `tripID` int(11) NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `startEnd` tinyint(1) DEFAULT NULL COMMENT '0==>start\r\n1==>end',
  `ranking` int(11) NOT NULL COMMENT 'from [1,n]',
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `details` varchar(255) NOT NULL,
  `timeArriveGo` time NOT NULL,
  `timeArriveBack` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stations`
--

INSERT INTO `stations` (`id`, `tripID`, `latitude`, `longitude`, `startEnd`, `ranking`, `name`, `address`, `details`, `timeArriveGo`, `timeArriveBack`) VALUES
(134, 23, 30.05845, 31.30224, 0, 1, 'Heliopolis', 'El-Tahrir Square, Abdeen, Cairo Governorate, Egypt', 'Bus Stop is located approximately 47 metres from the city centre, which is only a 1 minute walking distance so you can also reach it on foot.', '04:05:09', '07:15:09'),
(135, 23, 30.06323, 31.24694, NULL, 2, 'Ramses Square', 'Qesm Than Madinet Nasr, Cairo Governorate , Egypt', 'Bus Stop is located approximately 817 metres from the city centre, which is only a 11 minute walking distance so you can also reach it on foot.', '04:15:09', '07:25:09'),
(136, 23, 30.05845, 31.30225, NULL, 3, 'El-Torgoman', 'El-Tahrir Square, Abdeen, Cairo Governorate, Egypt', 'Bus Stop is located approximately 12.3 km from the city centre, which is approximately a 21 minute ride.', '04:25:09', '07:35:09'),
(137, 23, 30.06323, 31.24695, NULL, 4, 'Hadayek Al-Ahram', 'Qesm Than Madinet Nasr, Cairo Governorate , Egypt', 'Bus Stop is located approximately 47 metres from the city centre, which is only a 1 minute walking distance so you can also reach it on foot.', '04:35:09', '07:45:09'),
(138, 23, 30.05845, 31.30226, NULL, 5, 'Masaken El-Remaya', 'El-Tahrir Square, Abdeen, Cairo Governorate, Egypt', 'Bus Stop is located approximately 9.3 km from the city centre, which is approximately a 20 minute ride.', '04:45:09', '07:55:09'),
(139, 23, 30.06323, 31.24696, NULL, 6, 'El-Malek El-Saleh', 'Qesm Than Madinet Nasr, Cairo Governorate , Egypt', 'Bus Stop is located approximately 4.6 km from the city centre, which is approximately a 15 minute ride.', '04:55:09', '08:05:09'),
(140, 23, 30.05845, 31.30227, NULL, 7, 'El-Malek El-Saleh', 'El-Tahrir Square, Abdeen, Cairo Governorate, Egypt', 'Bus Stop is located approximately 47 metres from the city centre, which is only a 1 minute walking distance so you can also reach it on foot.', '04:05:09', '08:15:09'),
(141, 23, 30.06323, 31.24697, NULL, 8, 'El-Sawah Square', 'Qesm Than Madinet Nasr, Cairo Governorate , Egypt', 'Bus Stop is located approximately 817 metres from the city centre, which is only a 11 minute walking distance so you can also reach it on foot.', '05:15:09', '08:25:09'),
(142, 23, 30.05845, 31.30228, NULL, 9, 'El- Mataria Square', 'El-Tahrir Square, Abdeen, Cairo Governorate, Egypt', 'Bus Stop is located approximately 12.3 km from the city centre, which is approximately a 21 minute ride.', '05:25:09', '08:35:09'),
(143, 23, 30.06323, 31.24698, NULL, 10, 'El-Qalaa', 'Qesm Than Madinet Nasr, Cairo Governorate , Egypt', 'Bus Stop is located approximately 47 metres from the city centre, which is only a 1 minute walking distance so you can also reach it on foot.', '05:35:09', '08:45:09'),
(144, 23, 30.05845, 31.30229, NULL, 11, 'Islamic Cairo', 'El-Tahrir Square, Abdeen, Cairo Governorate, Egypt', 'Bus Stop is located approximately 9.3 km from the city centre, which is approximately a 20 minute ride.', '05:45:09', '08:55:09'),
(145, 23, 30.06323, 31.24699, NULL, 12, 'Nasr City', 'Qesm Than Madinet Nasr, Cairo Governorate , Egypt', 'Bus Stop is located approximately 4.6 km from the city centre, which is approximately a 15 minute ride.', '05:55:09', '09:05:09'),
(146, 23, 30.05845, 31.3023, NULL, 13, 'Zahraa Nasr City', 'El-Tahrir Square, Abdeen, Cairo Governorate, Egypt', 'Bus Stop is located approximately 47 metres from the city centre, which is only a 1 minute walking distance so you can also reach it on foot.', '06:05:09', '09:15:09'),
(147, 23, 30.06323, 31.247, NULL, 14, 'El-Malek El-Saleh', 'Qesm Than Madinet Nasr, Cairo Governorate , Egypt', 'Bus Stop is located approximately 817 metres from the city centre, which is only a 11 minute walking distance so you can also reach it on foot.', '06:15:09', '09:25:09'),
(148, 23, 30.05845, 31.30231, NULL, 15, 'Giza', 'El-Tahrir Square, Abdeen, Cairo Governorate, Egypt', 'Bus Stop is located approximately 12.3 km from the city centre, which is approximately a 21 minute ride.', '06:25:09', '09:35:09'),
(149, 23, 30.06323, 31.24701, NULL, 16, 'Egyptian Museum', 'Qesm Than Madinet Nasr, Cairo Governorate , Egypt', 'Bus Stop is located approximately 47 metres from the city centre, which is only a 1 minute walking distance so you can also reach it on foot.', '06:35:09', '09:45:09'),
(150, 23, 30.05845, 31.30232, NULL, 17, 'Masaken El-Remaya', 'El-Tahrir Square, Abdeen, Cairo Governorate, Egypt', 'Bus Stop is located approximately 9.3 km from the city centre, which is approximately a 20 minute ride.', '06:45:09', '09:55:09'),
(151, 23, 30.06323, 31.24702, NULL, 18, 'Hadayek Al-Ahram', 'Qesm Than Madinet Nasr, Cairo Governorate , Egypt', 'Bus Stop is located approximately 4.6 km from the city centre, which is approximately a 15 minute ride.', '06:55:09', '10:05:09'),
(152, 23, 30.05845, 31.30233, 1, 19, 'El-Wahat Road', 'El-Tahrir Square, Abdeen, Cairo Governorate, Egypt', 'Bus Stop is located approximately 47 metres from the city centre, which is only a 1 minute walking distance so you can also reach it on foot.', '07:05:09', '10:15:09');

-- --------------------------------------------------------

--
-- Table structure for table `trips`
--

CREATE TABLE `trips` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `vehicleIDGo` int(11) DEFAULT NULL,
  `vehicleIDBack` int(11) DEFAULT NULL,
  `driveridGo` int(11) DEFAULT NULL,
  `driveridBack` int(11) DEFAULT NULL,
  `startHGo` time NOT NULL,
  `endHGo` time NOT NULL,
  `startHBack` time NOT NULL,
  `endHBack` time NOT NULL,
  `price` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `goBack` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0==>go\r\n1==>back',
  `status` int(1) NOT NULL DEFAULT 0 COMMENT '0==>inactive\r\n1==>active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trips`
--

INSERT INTO `trips` (`id`, `name`, `vehicleIDGo`, `vehicleIDBack`, `driveridGo`, `driveridBack`, `startHGo`, `endHGo`, `startHBack`, `endHBack`, `price`, `description`, `goBack`, `status`) VALUES
(23, 'lmklbmbvvmvmmvvvm', NULL, NULL, 4, 4, '04:05:09', '07:05:09', '07:15:09', '10:15:09', 10, 'this trip is a trip going from 6 october to Mostorod ', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nationalityID` int(11) NOT NULL,
  `userName` varchar(255) NOT NULL,
  `gender` tinyint(1) NOT NULL COMMENT '1==>male\r\n0==>female',
  `specialNeeds` tinyint(1) NOT NULL COMMENT '0==>yes\r\n1==>no',
  `birthDate` date NOT NULL,
  `countryCode` varchar(4) NOT NULL,
  `homeAddressLong` double NOT NULL,
  `homeAddressLat` double NOT NULL,
  `workAddressLong` double NOT NULL,
  `workAddressLat` double NOT NULL,
  `profile_image` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `type` enum('admin','user','bus','') NOT NULL,
  `tripID` int(11) DEFAULT NULL,
  `counter` int(11) NOT NULL DEFAULT 0 COMMENT 'every user has 2 travels to the trip in the day as average',
  `token` varchar(255) NOT NULL,
  `deviceToken` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` int(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nationalityID`, `userName`, `gender`, `specialNeeds`, `birthDate`, `countryCode`, `homeAddressLong`, `homeAddressLat`, `workAddressLong`, `workAddressLat`, `profile_image`, `phone`, `type`, `tripID`, `counter`, `token`, `deviceToken`, `email`, `password`, `status`) VALUES
(6, 1, 'روماني عاطف عطيه', 1, 1, '2000-08-14', '+2', 31.30224, 30.05845, 31.24697, 30.06323, '1696593211797-715622718.jpg', '01223958296', 'user', 23, 18, 'e61a98907e17919b7c6903e5fc7b7013', 'ijnn;ijiojijioji', 'romany23@gmail.com', '$2b$10$XdslFSnLpFq47TK8MK.R/.OLof2PEGArDxl5q6I2SHrMo1GFOcpAu', 1),
(24, 1, 'روماني عاطف عطيه', 1, 0, '2000-08-14', '+2', 31.30224, 30.05845, 31.24697, 30.06323, '1696593328130-980953242.jpg', '01223958298', 'user', NULL, 0, '0b5475da853a2420ed18c5ca3afc3d76', 'ijnn;ijiojijioji', 'romany1@gmail.com', '$2b$10$Terepjs0ZMNB3uYKTmTYyuk3L3vGKm33in5X5wOdt30yoBHv4d4se', 1),
(25, 1, 'روماني عاطف عطيه', 1, 0, '2000-08-14', '+2', 31.30224, 30.05845, 31.24697, 30.06323, '1696593395318-874280431.jpg', '01223958292', 'user', NULL, 0, '0b5475da853a2420ed18c5ca3afc3d77', 'ijnn;ijiojijioji', 'romany1@gmail.com', '$2b$10$gZw88nom4s/.aK0VvtftueYfWZ9XRXDuG63IFiGFjWCGRxtO8VE8O', 1),
(26, 1, 'روماني عاطف عطيه', 1, 0, '2000-08-14', '+2', 31.30224, 30.05845, 31.24695, 30.06323, '1696593688323-46490645.jpg', '01280151607', 'admin', NULL, 0, 'a14a00637245aa516eae96dddb1ce175', '2fdb35aba2b3245cb108a1ee3fd46198', 'romany1981@gmail.com', '$2b$10$s8HJ/WeaP39jZ7EbMnPi8e2CEKvdwgBsEUdzPvnTjjGZ1gv9uKF/i', 1),
(31, 1, 'روماني عاطف عطيه', 1, 0, '2000-08-14', '+2', 23.23, 23.23, 23.23, 23.32, '1698438896142-592115090.jpg', '01280151667', 'user', NULL, 0, 'e657b7f593a9d27dc79680e561e442d3', NULL, 'romany194@gmail.com', '$2b$10$jGbTqr6bLewhD4unKh3VzegvnxbyT6doJziaZS8UvU3SQRhfc6F6m', 1);

-- --------------------------------------------------------

--
-- Table structure for table `variety`
--

CREATE TABLE `variety` (
  `id` int(11) NOT NULL,
  `conditions` varchar(255) DEFAULT NULL,
  `fqa` varchar(255) DEFAULT NULL,
  `promo` varchar(255) DEFAULT NULL,
  `tLink` varchar(255) DEFAULT NULL,
  `wLink` varchar(255) NOT NULL,
  `fLink` varchar(255) NOT NULL,
  `lLink` varchar(255) NOT NULL,
  `adressLink` varchar(255) NOT NULL,
  `dayStart` int(1) NOT NULL,
  `dayEnd` int(1) NOT NULL,
  `hourStart` time NOT NULL,
  `hourEnd` time NOT NULL,
  `phone` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `variety`
--

INSERT INTO `variety` (`id`, `conditions`, `fqa`, `promo`, `tLink`, `wLink`, `fLink`, `lLink`, `adressLink`, `dayStart`, `dayEnd`, `hourStart`, `hourEnd`, `phone`) VALUES
(2, NULL, 'gvhvhgvhvkh', 'pjiojiojiojkk', 'https://www.twitter.com/watch?v=0YvtjygNFFI&list=PLBAapNDSrNi0OOB_uCQxbDykJzA9JWJAe&index=7', 'https://www.whatsapp.com/watch?v=0YvtjygNFFI&list=PLBAapNDSrNi0OOB_uCQxbDykJzA9JWJAe&index=7', 'https://www.facebook.com/watch?v=0YvtjygNFFI&list=PLBAapNDSrNi0OOB_uCQxbDykJzA9JWJAe&index=7', 'https://www.linkedin.com/watch?v=0YvtjygNFFI&list=PLBAapNDSrNi0OOB_uCQxbDykJzA9JWJAe&index=7', 'https://www.google.com/maps/place/30%C2%B011\'53.1%22N+31%C2%B020\'36.6%22E/@30.1980826,31.3409371,17z/data=!3m1!4b1!4m14!1m9!4m8!1m3!2m2!1d31.34437!2d30.1922916!1m3!2m2!1d31.2935583!2d30.2338276!3m3!8m2!3d30.198078!4d31.343512?entry=ttu', 1, 6, '10:50:12', '21:12:12', '01223958299');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `model` varchar(255) NOT NULL,
  `vehicleNum` int(11) NOT NULL,
  `seats` int(11) NOT NULL,
  `passengeersNum` int(11) NOT NULL,
  `vehiclecolorAR` varchar(255) NOT NULL,
  `vehiclecolorEN` varchar(255) NOT NULL,
  `companyID` int(11) NOT NULL,
  `time` time NOT NULL,
  `locationlong` double NOT NULL,
  `locationlat` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contactus`
--
ALTER TABLE `contactus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `creditcard`
--
ALTER TABLE `creditcard`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userID` (`userID`);

--
-- Indexes for table `driver`
--
ALTER TABLE `driver`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `exceptiontrips`
--
ALTER TABLE `exceptiontrips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tripId` (`tripId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `externaltrips`
--
ALTER TABLE `externaltrips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tripID` (`tripID`),
  ADD KEY `userID` (`userID`);

--
-- Indexes for table `favaddress`
--
ALTER TABLE `favaddress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userID` (`userID`);

--
-- Indexes for table `maintenance`
--
ALTER TABLE `maintenance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicleID` (`vehicleID`);

--
-- Indexes for table `nationalities`
--
ALTER TABLE `nationalities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `otpstoring`
--
ALTER TABLE `otpstoring`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `qrcodes`
--
ALTER TABLE `qrcodes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userID` (`userID`);

--
-- Indexes for table `stations`
--
ALTER TABLE `stations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tripID` (`tripID`);

--
-- Indexes for table `trips`
--
ALTER TABLE `trips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicleID` (`vehicleIDGo`),
  ADD KEY `vehicleIDBack` (`vehicleIDBack`),
  ADD KEY `driveridGo` (`driveridGo`),
  ADD KEY `driveridBack` (`driveridBack`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `users_ibfk_1` (`nationalityID`),
  ADD KEY `tripID` (`tripID`);

--
-- Indexes for table `variety`
--
ALTER TABLE `variety`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `companyID` (`companyID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `contactus`
--
ALTER TABLE `contactus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `creditcard`
--
ALTER TABLE `creditcard`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `driver`
--
ALTER TABLE `driver`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `exceptiontrips`
--
ALTER TABLE `exceptiontrips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `externaltrips`
--
ALTER TABLE `externaltrips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `favaddress`
--
ALTER TABLE `favaddress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `maintenance`
--
ALTER TABLE `maintenance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `nationalities`
--
ALTER TABLE `nationalities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `otpstoring`
--
ALTER TABLE `otpstoring`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `qrcodes`
--
ALTER TABLE `qrcodes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stations`
--
ALTER TABLE `stations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=153;

--
-- AUTO_INCREMENT for table `trips`
--
ALTER TABLE `trips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `variety`
--
ALTER TABLE `variety`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `contactus`
--
ALTER TABLE `contactus`
  ADD CONSTRAINT `contactus_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `creditcard`
--
ALTER TABLE `creditcard`
  ADD CONSTRAINT `creditcard_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `exceptiontrips`
--
ALTER TABLE `exceptiontrips`
  ADD CONSTRAINT `exceptiontrips_ibfk_1` FOREIGN KEY (`tripId`) REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `exceptiontrips_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `externaltrips`
--
ALTER TABLE `externaltrips`
  ADD CONSTRAINT `externaltrips_ibfk_1` FOREIGN KEY (`tripID`) REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `externaltrips_ibfk_2` FOREIGN KEY (`userID`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `favaddress`
--
ALTER TABLE `favaddress`
  ADD CONSTRAINT `favaddress_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `maintenance`
--
ALTER TABLE `maintenance`
  ADD CONSTRAINT `maintenance_ibfk_1` FOREIGN KEY (`vehicleID`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `qrcodes`
--
ALTER TABLE `qrcodes`
  ADD CONSTRAINT `qrcodes_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stations`
--
ALTER TABLE `stations`
  ADD CONSTRAINT `stations_ibfk_1` FOREIGN KEY (`tripID`) REFERENCES `trips` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `trips`
--
ALTER TABLE `trips`
  ADD CONSTRAINT `trips_ibfk_1` FOREIGN KEY (`vehicleIDGo`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `trips_ibfk_2` FOREIGN KEY (`vehicleIDBack`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `trips_ibfk_3` FOREIGN KEY (`driveridGo`) REFERENCES `driver` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `trips_ibfk_4` FOREIGN KEY (`driveridBack`) REFERENCES `driver` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`nationalityID`) REFERENCES `nationalities` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`tripID`) REFERENCES `trips` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`companyID`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
