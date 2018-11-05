Feature: Text Message Network (Private message)

    Background:
        Given I have deployed the business network definition ..
        And I have added the following participants of type org.securelog.mynetwork.Member
            | userId           | firstName | lastName |
            | alice@email.com  | Alice     | A        |
            | bob@email.com    | Bob       | B        |
            | george@email.com | George    | G        |
        And I have added the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"001", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#bob@email.com", "subject":"Hello There!", "value":"This is a test"},
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"002", "creator":"org.securelog.mynetwork.Member#bob@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "subject":"Goodbye All!", "value":"Go Away"}
            ]
            """
        And I have issued the participant org.securelog.mynetwork.Member#alice@email.com with the identity alice1
        And I have issued the participant org.securelog.mynetwork.Member#bob@email.com with the identity bob1
        And I have issued the participant org.securelog.mynetwork.Member#george@email.com with the identity george1

    Scenario: Alice can read only her assets
        When I use the identity alice1
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"001", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#bob@email.com", "subject":"Hello There!", "value":"This is a test"}
            ]
            """

    Scenario: Bob can read all of the assets
        When I use the identity bob1
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"001", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#bob@email.com", "subject":"Hello There!", "value":"This is a test"},
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"002", "creator":"org.securelog.mynetwork.Member#bob@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "subject":"Goodbye All!", "value":"Go Away"}
            ]
            """

    Scenario: George can read only his assets
        When I use the identity george1
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"002", "creator":"org.securelog.mynetwork.Member#bob@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "subject":"Goodbye All!", "value":"Go Away"}
            ]
            """

    Scenario: Alice can add assets that she owns
        When I use the identity alice1
        And I add the following asset of type org.securelog.mynetwork.directMessage
            | messageId | creator         | recipient     | subject   | value               |
            | 003       | alice@email.com | bob@email.com | No Hello? | Wasn't this a test? |
        Then I should have the following assets of type org.securelog.mynetwork.directMessage
            | messageId | creator         | recipient     | subject   | value               |
            | 003       | alice@email.com | bob@email.com | No Hello? | Wasn't this a test? |

    Scenario: Alice cannot add assets that Bob owns
        When I use the identity alice1
        And I add the following asset of type org.securelog.mynetwork.directMessage
            | messageId | creator         | recipient       | subject    | value                       |
            | 003       | bob@email.com   | alice@email.com | No Subject | Ain't got nothing to say... |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Bob can add assets that he owns
        When I use the identity bob1
        And I add the following asset of type org.securelog.mynetwork.directMessage
            | messageId | creator         | recipient        | subject          | value        |
            | 004       | bob@email.com   | george@email.com | Goodbye Mr Bond! | Get Lost!    |
        Then I should have the following assets of type org.securelog.mynetwork.directMessage
            | messageId | creator         | recipient        | subject          | value        |
            | 004       | bob@email.com   | george@email.com | Goodbye Mr Bond! | Get Lost!    |

    Scenario: Bob cannot add assets that Alice owns
        When I use the identity bob1
        And I add the following asset of type org.securelog.mynetwork.directMessage
            | messageId | creator         | recipient     | subject          | value        |
            | 004       | alice@email.com | bob@email.com | Goodbye Mr Bond! | Get Lost!    |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Alice can update her assets
        When I use the identity alice1
        And I update the following asset of type org.securelog.mynetwork.directMessage
            | messageId | creator         | recipient     | subject   | value |
            | 001       | alice@email.com | bob@email.com | New Value | 50    |
        Then I should have the following assets of type org.securelog.mynetwork.directMessage
            | messageId | creator         | recipient     | subject   | value |
            | 001       | alice@email.com | bob@email.com | New Value | 50    |

    Scenario: Alice cannot update Bob's assets
        When I use the identity alice1
        And I update the following asset of type org.securelog.mynetwork.directMessage
            | messageId | creator         | recipient        | subject    | value |
            | 002       | bob@email.com   | george@email.com | No Subject | 50    |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Bob can update his assets
        When I use the identity bob1
        And I update the following asset of type org.securelog.mynetwork.directMessage
            | messageId | creator       | recipient        | subject   | value |
            | 002       | bob@email.com | george@email.com | New Value | 60    |
        Then I should have the following assets of type org.securelog.mynetwork.directMessage
            | messageId | creator       | recipient        | subject   | value |
            | 002       | bob@email.com | george@email.com | New Value | 60    |

    Scenario: Bob cannot update Alice's assets
        When I use the identity bob1
        And I update the following asset of type org.securelog.mynetwork.directMessage
            | messageId | creator         | recipient     |subject    | value |
            | 001       | alice@email.com | bob@email.com | No Subject | 60    |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Alice can remove her assets
        When I use the identity alice1
        And I remove the following asset of type org.securelog.mynetwork.directMessage
            | messageId |
            | 001       |
        Then I should not have the following assets of type org.securelog.mynetwork.directMessage
            | messageId |
            | 001       |

    Scenario: Alice cannot remove Bob's assets
        When I use the identity alice1
        And I remove the following asset of type org.securelog.mynetwork.directMessage
            | messageId |
            | 002       |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Bob can remove his assets
        When I use the identity bob1
        And I remove the following asset of type org.securelog.mynetwork.directMessage
            | messageId |
            | 002       |
        Then I should not have the following assets of type org.securelog.mynetwork.directMessage
            | messageId |
            | 002       |

    Scenario: Bob cannot remove Alice's assets
        When I use the identity bob1
        And I remove the following asset of type org.securelog.mynetwork.directMessage
            | messageId |
            | 001       |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Alice can submit a message
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateMessage", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "messageId":"003", "subject":"Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"003", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "subject":"Goodbye All!", "value":"Not this time."}
            ]
            """

    Scenario: Alice can submit a message without creator
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateMessage", "recipient":"org.securelog.mynetwork.Member#george@email.com", "messageId":"003", "subject":"Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"003", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "subject":"Goodbye All!", "value":"Not this time."}
            ]
            """

    Scenario: Alice can not submit a message that Bob owns
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateMessage", "creator":"org.securelog.mynetwork.Member#bob@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "messageId":"003", "subject":"Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Alice can not submit a message that has an existing message Id
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateMessage", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "messageId":"001", "subject":"Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should get an error matching /add object with ID .* as the object already exists/

    Scenario: Alice can update a message subject
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateSubject", "oldMessage":"org.securelog.mynetwork.directMessage#001", "newSubject":"Goodbye All!"}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"001", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#bob@email.com", "subject":"Goodbye All!", "value":"This is a test"}
            ]
            """

    Scenario: Alice can update a message value
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateValue", "oldMessage":"org.securelog.mynetwork.directMessage#001", "newValue":"This is not a test"}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"001", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#bob@email.com", "subject":"Hello There!", "value":"This is not a test"}
            ]
            """

    Scenario: Alice can not update Bob's message subject(can't see message)
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateSubject", "oldMessage":"org.securelog.mynetwork.directMessage#002", "newSubject":"Goodbye All2!"}
            ]
            """
        Then I should get an error matching /collection with ID .* does not exist/

    Scenario: Alice can not update Bob's message value(can't see message)
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateValue", "oldMessage":"org.securelog.mynetwork.directMessage#002", "newValue":"This is not a test"}
            ]
            """
        Then I should get an error matching /collection with ID .* does not exist/

    Scenario: Bob can submit a message
        When I use the identity bob1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateMessage", "creator":"org.securelog.mynetwork.Member#bob@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "messageId":"003", "subject":"Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directMessage", "messageId":"003", "creator":"org.securelog.mynetwork.Member#bob@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "subject":"Goodbye All!", "value":"Not this time."}
            ]
            """

    Scenario: Bob can not submit a message that Alice owns
        When I use the identity bob1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateMessage", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "messageId":"003", "subject":"Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Bob can not update Alice's message subject
        When I use the identity bob1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateSubject", "oldMessage":"org.securelog.mynetwork.directMessage#001", "newSubject":"Goodbye All2!"}
            ]
            """
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Bob can not update Alice's message value
        When I use the identity bob1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateValue", "oldMessage":"org.securelog.mynetwork.directMessage#001", "newValue":"This is not a test"}
            ]
            """
        Then I should get an error matching /does not have .* access to resource/

    Scenario: George can not update Bob's message subject
        When I use the identity george1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateSubject", "oldMessage":"org.securelog.mynetwork.directMessage#002", "newSubject":"Goodbye All2!"}
            ]
            """
        Then I should get an error matching /does not have .* access to resource/

    Scenario: George can not update Bob's message value
        When I use the identity george1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateValue", "oldMessage":"org.securelog.mynetwork.directMessage#002", "newValue":"This is not a test"}
            ]
            """
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Alice can submit a reply for her message
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateReply", "parentMessage":"org.securelog.mynetwork.directMessage#001", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "replyId":"051", "subject":"Re: Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directReply", "messageId":"051", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "replyTo":"org.securelog.mynetwork.directMessage#001", "subject":"Re: Goodbye All!", "value":"Not this time."}
            ]
            """

    Scenario: Alice can not submit a reply for bob's message
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateReply", "parentMessage":"org.securelog.mynetwork.directMessage#002", "creator":"org.securelog.mynetwork.Member#alice@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "replyId":"051", "subject":"Re: Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should get an error matching /collection with ID .* does not exist/

    Scenario: Bob can submit a reply for his messages
        When I use the identity bob1
        And I submit the following transactions
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateReply", "parentMessage":"org.securelog.mynetwork.directMessage#002", "creator":"org.securelog.mynetwork.Member#bob@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "replyId":"051", "subject":"Re: Goodbye All!", "value":"Not this time."},
            {"$class":"org.securelog.mynetwork.sendPrivateReply", "parentMessage":"org.securelog.mynetwork.directMessage#001", "creator":"org.securelog.mynetwork.Member#bob@email.com", "recipient":"org.securelog.mynetwork.Member#alice@email.com", "replyId":"052", "subject":"Re: Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directReply", "messageId":"051", "creator":"org.securelog.mynetwork.Member#bob@email.com", "recipient":"org.securelog.mynetwork.Member#george@email.com", "replyTo":"org.securelog.mynetwork.directMessage#002", "subject":"Re: Goodbye All!", "value":"Not this time."},
            {"$class":"org.securelog.mynetwork.directReply", "messageId":"052", "creator":"org.securelog.mynetwork.Member#bob@email.com", "recipient":"org.securelog.mynetwork.Member#alice@email.com", "replyTo":"org.securelog.mynetwork.directMessage#001", "subject":"Re: Goodbye All!", "value":"Not this time."}
            ]
            """

    Scenario: George can submit a reply for his message
        When I use the identity george1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateReply", "parentMessage":"org.securelog.mynetwork.directMessage#002", "creator":"org.securelog.mynetwork.Member#george@email.com", "recipient":"org.securelog.mynetwork.Member#bob@email.com", "replyId":"051", "subject":"Re: Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.directReply", "messageId":"051", "creator":"org.securelog.mynetwork.Member#george@email.com", "recipient":"org.securelog.mynetwork.Member#bob@email.com", "replyTo":"org.securelog.mynetwork.directMessage#002", "subject":"Re: Goodbye All!", "value":"Not this time."}
            ]
            """

    Scenario: George can not submit a reply for alice's message
        When I use the identity george1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.sendPrivateReply", "parentMessage":"org.securelog.mynetwork.directMessage#001", "creator":"org.securelog.mynetwork.Member#george@email.com", "recipient":"org.securelog.mynetwork.Member#bob@email.com", "replyId":"051", "subject":"Re: Goodbye All!", "value":"Not this time."}
            ]
            """
        Then I should get an error matching /collection with ID .* does not exist/
