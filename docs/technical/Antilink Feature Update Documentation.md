# Antilink Feature Update Documentation

## Table of Contents

<details>

   <summary>Contents</summary>

1. [1. Overview](#1-overview)
1. [2. Feature Description](#2-feature-description)
   1. [2.1. Modes](#21-modes)
      1. [2.1.1. Whitelist Mode](#211-whitelist-mode)
      1. [2.1.2. Blacklist Mode](#212-blacklist-mode)
   1. [2.2. Subcommands](#22-subcommands)
   1. [2.3. Storage](#23-storage)
1. [3. Technical Implementation](#3-technical-implementation)
   1. [3.1. File Structure](#31-file-structure)
      1. [3.1.1. commands/antilink.js](#311-commandsantilinkjs)
      1. [3.1.2. lib/antilink.js](#312-libantilinkjs)
      1. [3.1.3. lib/index.js](#313-libindexjs)
      1. [3.1.4. data/userGroupData.json](#314-datausergroupdatajson)
   1. [3.2. Key Changes](#32-key-changes)
      1. [3.2.1. Antilink Command Enhancements (`commands/antilink.js`)](#321-antilink-command-enhancements-commandsantilinkjs)
      1. [3.2.2. Link Detection Logic (`lib/antilink.js`)](#322-link-detection-logic-libantilinkjs)
      1. [3.2.3. Data Management (`lib/index.js`)](#323-data-management-libindexjs)
      1. [3.2.4. Data Storage (`data/userGroupData.json`)](#324-data-storage-datausergroupdatajson)
   1. [3.3. Key Functions](#33-key-functions)
      1. [3.3.1 containsURL(str) (`lib/antilink.js`)](#331-containsurlstr-libantilinkjs)
      1. [3.3.2 handleAntilinkCommand (`commands/antilink.js`)](#332-handleantilinkcommand-commandsantilinkjs)
      1. [3.3.3 allowLinks/blockLinks (`lib/index.js`)](#333-allowlinksblocklinks-libindexjs)
      1. [3.3.4 setAntilink (`lib/index.js`)](#334-setantilink-libindexjs)
1. [4. Usage Instructions](#4-usage-instructions)
   1. [4.1. Prerequisites](#41-prerequisites)
   1. [4.2. Commands](#42-commands)
   1. [4.3. Behavior](#43-behavior)
      1. [4.3.1. Whitelist Mode](#431-whitelist-mode)
      1. [4.3.2. Blacklist Mode](#432-blacklist-mode)
1. [5. Testing Guidelines](#5-testing-guidelines)
   1. [5.1. Setup](#51-setup)
   1. [5.2. Test Cases](#52-test-cases)
      1. [5.2.2 Set Action](#522-set-action)
      1. [5.2.3 Blacklist Mode](#523-blacklist-mode)
      1. [5.2.4 Whitelist Mode](#524-whitelist-mode)
      1. [5.2.5 Allow/Block](#525-allowblock)
      1. [5.2.6 Admin Exemption](#526-admin-exemption)
   1. [5.3. Verification](#53-verification)
1. [Dependencies](#dependencies)
1. [Limitations](#limitations)
1. [Future Improvements](#future-improvements)
1. [Authors](#authors)

</details>

## 1. Overview

The antilink feature has been enhanced to support whitelist and blacklist modes for link restrictions, along with subcommands to manage allowed and blocked links. This update allows group admins to specify which links are permitted or restricted, providing finer control over link-sharing in group chats.

## 2. Feature Description

The antilink feature prevents users from sharing unauthorized links in group chats by detecting URLs in messages and taking predefined actions (delete, warn, or kick). The updated feature introduces:

### 2.1. Modes

#### 2.1.1. Whitelist Mode

Blocks all links except those explicitly allowed.

#### 2.1.2. Blacklist Mode

Allows all links except those explicitly blocked.

### 2.2. Subcommands

- `.antilink allow <link(s)>`: Adds links to the allowed list, removing them from the blocked list if present.

- `.antilink block <link(s)>`: Adds links to the blocked list, removing them from the allowed list if present.

- `.antilink forget <link(s)>`: Removes links from both the allowed and blocked lists.

- `.antilink list`: Displays the current allowed and blocked links.

- `.antilink mode <whitelist|blacklist>`: Sets the antilink mode for the group.

### 2.3. Storage

Configuration (mode, allowed/blocked links) is stored in `data/userGroupData.json`.

## 3. Technical Implementation

### 3.1. File Structure

The feature is implemented across the following files:

#### 3.1.1. commands/antilink.js

Handles the antilink command logic, including subcommands (`on`, `off`, `set`, `get`, `allow`, `block`, `forget`, `list`, `mode`).

#### 3.1.2. lib/antilink.js

Contains the core antilink detection and action logic, including URL checking based on whitelist/blacklist modes.

#### 3.1.3. lib/index.js

Manages data storage and retrieval for antilink configurations in `data/userGroupData.json`.

#### 3.1.4. data/userGroupData.json

Stores group-specific antilink settings, including `enabled`, `action`, `mode`, `allowedLinks`, and `blockedLinks`.

### 3.2. Key Changes

The following changes were made to implement the feature:

#### 3.2.1. Antilink Command Enhancements (`commands/antilink.js`)

1. Added `allow`, `block`, `forget`, `list`, and `mode` subcommands to manage link lists and modes.

1. Updated the `get` subcommand to display the current mode.

**Example 1:** `.antilink allow google.com` adds `google.com` to `allowedLinks` and removes it from `blockedLinks`.

**Example 2:** `.antilink block example.com` adds `example.com` to `blockedLinks` and removes it from `allowedLinks`.

**Example 3:** `.antilink forget example.com google.com` removes `example.com` and `google.com` from both allowedLinks and blockedLinks.

**Example 4:** `.antilink forget all` clears both allowedLinks and blockedLinks.

**Example 5:** `.antilink get` sends a message like this to the group chat:

**_Antilink Configuration:_**\
 Status: ON\
 Action: delete\
 Mode: whitelist

**Example 6:** `.antilink list` sends a message like this to the group chat:

**_Allowed Links:_**

- google.com
- example.com

**_Blocked Links:_**

- example.com

**Example 7:** `.antilink mode blacklist` sets antilink mode to blacklist.

**Example 8:** `.antilink mode whitelist` sets antilink mode to whitelist.

#### 3.2.2. Link Detection Logic (`lib/antilink.js`)

1. Modified `containsURL` to be async and check URLs against `allowedLinks` (in whitelist mode) or `blockedLinks` (in blacklist mode).

1. Used global variables `ALLOWED_LINKS` and `BLOCKED_LINKS` to store the group's link lists during processing.

#### 3.2.3. Data Management (`lib/index.js`)

1. Added `allowLinks` and `blockLinks` functions to update `allowedLinks` and `blockedLinks` arrays in `userGroupData.json`.

1. Modified `setAntilink` to accept a `mode` parameter (default: `whitelist`).

1. Ensured mutual exclusivity: links added to `allowedLinks` are removed from `blockedLinks`, and vice versa.

#### 3.2.4. Data Storage (`data/userGroupData.json`)

1. Extended the `antilink` object to include `allowedLinks`, `blockedLinks`, and `mode` fields for each group.

1. Example structure after `.antilink allow google.com` and `.antilink block example.com`:

```json
{
  "antilink": {
    "120363421902713312@g.us": {
      "enabled": true,
      "action": "delete",
      "mode": "whitelist",
      "allowedLinks": ["google.com"],
      "blockedLinks": ["example.com"]
    }
  }
}
```

### 3.3. Key Functions

#### 3.3.1 containsURL(str) (`lib/antilink.js`)

- Checks if a string contains URLs using a regex pattern.

- In whitelist mode, returns `true` if any URL is not in `allowedLinks`.

- In blacklist mode, returns `true` if any URL is in `blockedLinks`.

#### 3.3.2 handleAntilinkCommand (`commands/antilink.js`)

- Processes subcommands to enable/disable antilink, set actions, manage link lists, and set modes.

#### 3.3.3 allowLinks/blockLinks (`lib/index.js`)

- Updates `userGroupData.json` with new allowed or blocked links, ensuring mutual exclusivity.

#### 3.3.4 setAntilink (`lib/index.js`)

- Configures antilink settings, including the new `mode` field.

## 4. Usage Instructions

### 4.1. Prerequisites

1. The bot must be an admin in the group to perform actions like `delete` or `kick`.

1. Only group admins can use `.antilink` subcommands.

### 4.2. Commands

| Command                                 | Description                                                                                             | Example                                                             |
| :-------------------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------ |
| `.antilink allow <link(s)>`             | Adds links to the allowed list, removing them from blocked list if present.                             | `.antilink allow google.com`                                        |
| `.antilink block <link(s)>`             | Adds links to the blocked list, removing them from allowed list if present.                             | `.antilink block example.com`                                       |
| `.antilink forget <link(s)\|all>`       | Removes links from both allowed and blocked lists, or clears all if `all`.                              | `.antilink forget example.com google.com`<br>`.antilink forget all` |
| `.antilink get`                         | Displays current antilink configuration (status, action, mode).                                         | `.antilink get`                                                     |
| `.antilink list`                        | Lists current allowed and blocked links.                                                                | `.antilink list`                                                    |
| `.antilink mode <blacklist\|whitelist>` | Sets the antilink mode.                                                                                 | `.antilink mode whitelist`                                          |
| `.antilink off`                         | Disables antilink feature.                                                                              | `.antilink off`                                                     |
| `.antilink on`                          | Enables antilink feature with the last set action and mode.                                             | `.antilink on`                                                      |
| `.antilink reset`                       | Resets antilink settings to default (disabled, no action, no allowed links, no blocked links, no mode). | `.antilink reset`                                                   |
| `.antilink set <delete\|warn\|kick>`    | Sets the antilink action.                                                                               | `.antilink set kick`                                                |

### 4.3. Behavior

#### 4.3.1. Whitelist Mode

Blocks all links except those in `allowedLinks`.

**Example:** If `allowedLinks: ["google.com"]`, `www.google.com` is allowed, but `https://example.com` is blocked.

#### 4.3.2. Blacklist Mode

Allows all links except those in `blockedLinks`.

**Example:** If `blockedLinks: ["chat.whatsapp.com"]`, `https://google.com` is allowed, but `https://example.com` is blocked.

- Admins and the bot are exempt from antilink restrictions.

- Actions (`delete`, `warn`, `kick`) are applied to non-exempt users sending restricted links.

## 5. Testing Guidelines

### 5.1. Setup

- Ensure the bot is running as an admin in a test WhatsApp group.

### 5.2. Test Cases

| Case No. | Case Description               | Steps                                                                                                                                                                         | Expected Result                                                                                                                                                                                                                                          | Actual Result |
| :------: | :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ |
|    1     | Reset Antilink settings        | 1. As a group admin, send `.antilink reset` in the group.                                                                                                                     | Bot should respond with the message:<br><br>**_Antilink settings reset._**                                                                                                                                                                               |               |
|    2     | Get Antilink configuration     | 1. As a group admin, send `.antilink get` in the group.                                                                                                                       | Bot should respond with a message like:<br><br>**_Antilink Configuration:_**<br>Status: OFF<br>Action: Not set<br>Mode: Not set                                                                                                                          |
|    3     | Get allowed/blocked links list | 1. As a group admin, send `.antilink list` in the group.                                                                                                                      | Bot should respond with the message:<br><br>**_Allowed Links:_**<br>No allowed links.<br><br>**_Blocked Links:_**<br>No blocked links.                                                                                                                   |               |
|    4     | Enable Antilink                | As a group admin,<br><br>1. Send `.antilink on` in the group.<br><br>2. Verify status with `.antilink get`.                                                                   | 1. Bot should respond with the message:<br><br>**_Antilink has been turned ON_**<br><br>2. Bot should respond with the message:<br><br>**_Antilink Configuration:_**<br>Status: ON<br>Action: delete<br>Mode: whitelist                                  |
|    5     | Disable Antilink               | As a group admin,<br><br>1. Send `.antilink off` in the group.<br><br>2. Verify status with `.antilink get`.                                                                  | 1. Bot should respond with the message:<br><br>**_Antilink has been turned OFF_**<br><br>2. Bot should respond with the message:<br><br>**_Antilink Configuration:_**<br>Status: OFF<br>Action: Not set<br>Mode: Not set                                 |
|    6     | Send link with Antilink off    | 1. As a non-admin group member, send a link in the group.                                                                                                                     | No action should be taken; the message should remain in the chat.                                                                                                                                                                                        |
|    7     | Set Antilink action to delete  | As a group admin,<br><br>1. Send `.antilink set delete` in the group.<br><br>2. Verify action with `.antilink get`.                                                           | 1. Bot should respond with the message:<br><br>**_Antilink action set to delete_**<br><br>2. Bot should respond with the message:<br><br>**_Antilink Configuration:_**<br>Status: ON<br>Action: delete<br>Mode: whitelist                                |
|    8     | Test delete action             | 1. With the antilink action set to delete, send a link not in allowed links as a non-admin group member.                                                                      | 1. Bot should delete the message.<br><br>2. Bot should send the message:<br><br>**_@&lt;username&gt; your message has been deleted because it contains one or more unwanted links_**                                                                     |
|    9     | Set Antilink action to kick    | As a group admin,<br><br>1. Send `.antilink set kick` in the group.<br><br>2. Verify action with `.antilink get`.                                                             | 1. Bot should respond with the message:<br><br>**_Antilink action set to kick_**<br><br>2. Bot should respond with the message:<br><br>**_Antilink Configuration:_**<br>Status: ON<br>Action: kick<br>Mode: whitelist                                    |
|    10    | Test kick action               | 1. With the antilink action set to kick, send a link not in allowed links as a non-admin group member.                                                                        | 1. Bot should delete the message.<br><br>2. Bot should remove the user from the group.<br><br>2. Bot should send the message:<br><br>**_@&lt;username&gt; has been kicked for sending unwanted links_**                                                  |
|    11    | Set Antilink action to warn    | As a group admin,<br><br>1. Send `.antilink set warn` in the group.<br><br>2. Verify action with `.antilink get`.                                                             | 1. Bot should respond with the message:<br><br>**_Antilink action set to warn_**<br><br>2. Bot should respond with the message:<br><br>**_Antilink Configuration:_**<br>Status: ON<br>Action: warn<br>Mode: whitelist                                    |
|    12    | Test warn action               | 1. With the antilink action set to warn, send a link not in allowed links as a non-admin group member.                                                                        | 1. Bot should delete the message.<br><br>2. Bot should send the message:<br><br>**_@&lt;username&gt; warning 1/3 for sending unwanted links_**                                                                                                           |
|    13    | Set Antilink mode to blacklist | As a group admin,<br><br>1. Send `.antilink mode blacklist` in the group.<br><br>2. Verify mode with `.antilink get`.                                                         | 1. Bot should respond with the message:<br><br>**_Antilink mode set to blacklist_**<br><br>2. Bot should respond with the message:<br><br>**_Antilink Configuration:_**<br>Status: ON<br>Action: warn<br>Mode: blacklist                                 |
|    14    | Allow a link                   | As a group admin,<br><br>1. Send `.antilink allow google.com youtube.com` in the group.<br><br>2. Verify with `.antilink list`.                                               | 1. Bot should respond with the message:<br><br>**_Allowed links updated_**<br><br>2. Bot should respond with the message:<br><br>**_Allowed Links:_**<br>• google.com<br>• youtube.com<br><br>**_Blocked Links:_**<br>No blocked links.                  |
|    15    | Block a link                   | As a group admin,<br><br>1. Send `.antilink block example.com` in the group.<br><br>2. Verify with `.antilink list`.                                                          | 1. Bot should respond with the message:<br><br>**_Blocked links updated_**<br><br>2. Bot should respond with the message:<br><br>**_Allowed Links:_**<br>• google.com<br>• youtube.com<br><br>**_Blocked Links:_**<br>• example.com                      |
|    16    | Allow a blocked link           | As a group admin,<br><br>1. Send `.antilink allow example.com` in the group.<br><br>2. Verify with `.antilink list`.                                                          | 1. Bot should respond with the message:<br><br>**_Allowed links updated_**<br><br>2. Bot should respond with the message:<br><br>**_Allowed Links:_**<br>• google.com<br>• youtube.com<br>• example.com<br><br>**_Blocked Links:_**<br>No blocked links. |
|    17    | Block an allowed link          | As a group admin,<br><br>1. Send `.antilink block youtube.com` in the group.<br><br>2. Verify with `.antilink list`.                                                          | 1. Bot should respond with the message:<br><br>**_Blocked links updated_**<br><br>2. Bot should respond with the message:<br><br>**_Allowed Links:_**<br>• google.com<br>• example.com<br><br>**_Blocked Links:_**<br>• youtube.com                      |
|    18    | Test blacklist mode            | 1. With the antilink mode set to blacklist, send a link in blocked links as a non-admin group member.<br><br>2. Send a link not in blocked links as a non-admin group member. | 1. Bot should delete the message and send the warning message:<br><br>**_@&lt;username&gt; warning 2/3 for sending unwanted links_**<br><br>2. No action should be taken; the message should remain in the chat.                                         |
|    19    | Set Antilink mode to whitelist | As a group admin,<br><br>1. Send `.antilink mode whitelist` in the group.<br><br>2. Verify mode with `.antilink get`.                                                         | 1. Bot should respond with the message:<br><br>**_Antilink mode set to whitelist_**<br><br>2. Bot should respond with the message:<br><br>**_Antilink Configuration:_**<br>Status: ON<br>Action: warn<br>Mode: whitelist                                 |
|    20    | Test whitelist mode            | 1. With the antilink mode set to whitelist, send a link in allowed links as a non-admin group member.<br><br>2. Send a link not in allowed links as a non-admin group member. | 1. No action should be taken; the message should remain in the chat.<br><br>2. Bot should delete the message, remove the user, and send the message:<br><br>**_@&lt;username&gt; has been kicked after 3 warnings_**                                     |
|    21    | Admin Exemption                | 1. Send a link not in allowed links as a group admin                                                                                                                          | No action should be taken; the message should remain in the chat.                                                                                                                                                                                        |               |

## 6. Dependencies

### 6.1. Node.js Modules

1. `@whiskeysockets/baileys`: For WhatsApp socket communication.

2. `fs`: For reading/writing `userGroupData.json`.

### 6.2. Internal Modules

1. `lib/isAdmin.js`: Checks admin status.

2. `lib/index.js`: Manages data storage/retrieval.

3. `config.js`: Provides configuration (e.g., `WARN_COUNT`).

## 7. Authors

Sherpad Ndabambi (sgndabambi@gmail.com)
