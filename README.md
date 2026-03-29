# System Architecture and Project Structure

![System Architecture](ESOGU-IFARLAB-Cloud-Application/build/meshes/system%20(1).png)

This document explains the general architecture of the system, server structures, and the communication between sub-components.

## 1. Robot Host Server

This server is responsible for collecting, processing, and storing ROS 2 data on the robot cell network.

*   Robot Cell Network ROS 2 Publishers: Publishes instant telemetry data and joint state information from the robot cell.
*   ROS2-Kafka Bridge: Converts data from the ROS 2 environment into Kafka messages and forwards them.
*   Kafka Broker (Port 9092): Temporarily stores and manages the data stream.
*   ES Indexer: Takes data from Kafka topics, converts it into Elasticsearch format, and indexes it.
*   Elasticsearch (Port 9200): Stores incoming robot telemetry data permanently and queryable in a time-series structure.
*   Grafana: Fetches data from Elasticsearch to visualize it and creates analysis dashboards.

## 2. IFARLAB-EDIH Host Server

It is the main cloud application that provides user interaction and centralized management of the system.

### Cloud Application
*   Platform API (Port 3001): The center of backend services. It handles requests (via REST).
    *   MongoDB (Port 27017): Stores user registration, login, and forum data.
    *   FMU Service (Port 5001): Runs the simulation models of the system (Functional Mock-up Unit). Communicates with the Platform API.
*   BUILD (Port 8080): Hosts the front-end application. It accesses the Platform API via REST and Elasticsearch via Ethernet Polling. The Grafana interface is embedded in the system with Ethernet/iframe.
*   Pages:
    *   FMU Models: Displays model data coming from the FMU Service.
    *   Telemetry-Driven Kinematic Twin: Animates the kinematic twin of the robot by processing the robot joint states via the Platform API.
    *   Analytics (Grafana Embed): Presents Grafana dashboards as an embedded iframe.
    *   STLC Manager: Provides the STLC (Software Testing Life Cycle) management interface.
    *   Auth / Forum / Docs / Home: Provides access to authorization and platform documentation.

## 3. STLC Manager

It acts as an independent unit managing the software testing life cycle. It is the management part directed by the application.

*   STLC Backend (Port 8000): The backend service hosting the business logic of the STLC system.
*   STLC Frontend (Port 5173): The user interface of the STLC system itself.
*   STLC MongoDB: A custom database set up solely to store test results and analysis files.

## Communication Protocols and Flow
*   Data Flow: ROS 2 data reaches analytics and the cloud API via Kafka -> Elasticsearch.
*   REST Communication: The client on BUILD is fed directly over REST with the Platform API.
*   Iframe Embed: Analytic panels are pulled into the application via iframe from Grafana, an external service.
