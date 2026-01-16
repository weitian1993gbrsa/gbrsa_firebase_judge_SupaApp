# GBRSA SupaApp - Competition Judging System

> **The all-in-one platform for managing GBRSA Rope Skipping competitions.**

This web application streamlines the entire workflow of a rope skipping event, from participant management to real-time judging and final results. It replaces paper-based scoring with a live, cloud-synchronized system.

## 🌟 System Workflow

The following diagram illustrates how data flows through the system during an event:

```mermaid
graph TD
    %% Actors
    Admin([Admin / Setup])
    Importer([Data Importer])
    Host([Event Host])
    
    %% Judges
    SpeedJudge[Speed Judge <br/> (Clicker)]
    FreeDiff[Freestyle Judge <br/> (Difficulty)]
    FreePres[Freestyle Judge <br/> (Presentation)]
    FreeTech[Freestyle Judge <br/> (Technical)]
    
    %% System
    DB[(Firebase Firestore <br/> Real-time DB)]
    LiveBoard{{Live Scoreboard <br/> (Big Screen)}}
    Cert[Certificate Generator]

    %% Flow
    Importer -->|Upload CSV Data| DB
    Admin -->|Manage Event State| DB
    
    subgraph Judging Panel
        SpeedJudge -->|Live Clicks| DB
        FreeDiff -->|Score Input| DB
        FreePres -->|Score Input| DB
        FreeTech -->|Score Input| DB
    end
    
    DB -->|Real-time Updates| LiveBoard
    DB -->|Sync Info| Host
    DB -->|Final Scores| Cert
```

## 🚀 Key Capabilities

### 1. Centralized Event Management
-   **CSV Import**: Easily upload participant lists, divisions, and team data.
-   **Event Control**: Admins can Open/Close lanes, reset scores, and manage the schedule live.

### 2. Specialized Judging Interfaces
The app provides custom interfaces tailored to each judging role:
-   **Speed Judging**: A large touch-optimized "Clicker" interface for counting jumps.
-   **Freestyle Judging**: Complex scoring forms for Difficulty, Presentation, Required Elements, and Technical judging.
-   **Station Logic**: Judges login with a specific "Station Key" (e.g., `ss1`) and are automatically routed to their assigned lane and role.

### 3. Live Audience Experience
-   **Live Scoreboard**: A dedicated view for projectors/big screens that updates instantly as judges tap their screens. Show the audience the scores *as they happen*.
-   **Host View**: Gives the MC/Announcer real-time info on who is competing and their current standing.

### 4. Results & Rewards
-   **Automated Ranking**: The system calculates winners based on GBRSA rules.
-   **Certificates**: Generate and print PDF certificates for winners directly from the app.

---

##  Login Access Keys

The system uses a **Key-Based Authentication** system. Users enter a simple code to access their specific role.

| Role | Key Prefix | Description |
| :--- | :--- | :--- |
| **Speed Judge** | `ss` (1-12) | E.g., `ss1` = Speed Station 1. Counts jumps. |
| **Difficulty** | `fd` (1-3) | Freestyle Difficulty judge. |
| **Technical** | `ft` (1-3) | Freestyle Technical judge. |
| **Presentation** | `fp` (1-3) | Freestyle Presentation judge. |
| **Required Elements** | `fr` (1-3) | Freestyle Required Elements judge. |
| **Admin** | *secret* | Full system access. |
| **Live Board** | *secret* | Read-only view for the big screen. |
