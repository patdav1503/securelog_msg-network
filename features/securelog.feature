Feature: Secure Logging Network

    Background:
        Given I have deployed the business network definition ..
        And I have added the following participants of type org.securelog.mynetwork.Member
            | userId          | firstName | lastName |
            | alice@email.com | Alice     | A        |
        And I have added the following participants of type org.securelog.mynetwork.Level2
            | userId          | firstName | lastName |
            | bob@email.com   | Bob       | B        |
        And I have added the following participants of type org.securelog.mynetwork.Level3
            | userId             | firstName | lastName |
            | george@email.com   | George    | G        |
        And I have added the following participants of type org.securelog.mynetwork.System
            | userId             | firstName    | lastName |
            | system@email.com   | System       | S        |
        And I have added the following assets of type org.securelog.mynetwork.ErrorMessage
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"001", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "errorType":"Math Module","errorSeverity":"CRITICAL","errorStatus":"NEW","errorText":"Exception in the function add"},
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"002", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#bob@email.com", "errorType":"Math Module","errorSeverity":"WARNING","errorStatus":"NEW","errorText":"Non fatal exception in the function multiply"}
            ]
            """
        And I have issued the participant org.securelog.mynetwork.Member#alice@email.com with the identity alice1
        And I have issued the participant org.securelog.mynetwork.Level2#bob@email.com with the identity bob1
        And I have issued the participant org.securelog.mynetwork.Level3#george@email.com with the identity george1
        And I have issued the participant org.securelog.mynetwork.System#system@email.com with the identity system1

    Scenario: Alice can read all of the assets
        When I use the identity alice1
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"001", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "errorType":"Math Module","errorSeverity":"CRITICAL","errorStatus":"NEW","errorText":"Exception in the function add"},
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"002", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#bob@email.com", "errorType":"Math Module","errorSeverity":"WARNING","errorStatus":"NEW","errorText":"Non fatal exception in the function multiply"}
            ]
            """

    Scenario: Bob can read one of the assets
        When I use the identity bob1
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"002", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#bob@email.com", "errorType":"Math Module","errorSeverity":"WARNING","errorStatus":"NEW","errorText":"Non fatal exception in the function multiply"}
            ]
            """

    Scenario: Bob cannot read one of the assets
        When I use the identity bob1
        Then I should not have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"001", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "errorType":"Math Module","errorSeverity":"CRITICAL","errorStatus":"NEW","errorText":"Exception in the function add"}
            ]
            """

    Scenario: George can read all of the assets
        When I use the identity george1
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"001", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "errorType":"Math Module","errorSeverity":"CRITICAL","errorStatus":"NEW","errorText":"Exception in the function add"},
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"002", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#bob@email.com", "errorType":"Math Module","errorSeverity":"WARNING","errorStatus":"NEW","errorText":"Non fatal exception in the function multiply"}
            ]
            """
    Scenario: Alice can add assets that she owns
        When I use the identity alice1
        And I add the following asset of type org.securelog.mynetwork.ErrorMessage
            | messageId | creator          | owner           | errorType   | errorSeverity | errorStatus | errorText                                     |
            | 003       | system@email.com | alice@email.com | Math Module | CRITICAL      | NEW         | Exception in function average, divide by zero |
        Then I should have the following assets of type org.securelog.mynetwork.ErrorMessage
            | messageId | creator          | owner           | errorType   | errorSeverity | errorStatus | errorText                                     |
            | 003       | system@email.com | alice@email.com | Math Module | CRITICAL      | NEW         | Exception in function average, divide by zero |

    Scenario: Alice cannot add assets that Bob owns
        When I use the identity alice1
        And I add the following asset of type org.securelog.mynetwork.ErrorMessage
            | messageId | creator          | owner           | errorType   | errorSeverity | errorStatus | errorText                                     |
            | 003       | system@email.com | bob@email.com   | Math Module | CRITICAL      | NEW         | Exception in function average, divide by zero |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Bob can add assets that he owns
        When I use the identity bob1
        And I add the following asset of type org.securelog.mynetwork.ErrorMessage
            | messageId | creator          | owner           | errorType       | errorSeverity | errorStatus | errorText                          |
            | 004       | system@email.com | bob@email.com   | Graphics Module | ERROR         | NEW         | Exception drawing on remote screen |
        Then I should have the following assets of type org.securelog.mynetwork.ErrorMessage
            | messageId | creator          | owner           | errorType       | errorSeverity | errorStatus | errorText                          |
            | 004       | system@email.com | bob@email.com   | Graphics Module | ERROR         | NEW         | Exception drawing on remote screen |

    Scenario: Bob cannot add assets that Alice owns
        When I use the identity bob1
        And I add the following asset of type org.securelog.mynetwork.ErrorMessage
            | messageId | creator          | owner           | errorType       | errorSeverity | errorStatus | errorText                          |
            | 004       | system@email.com | alice@email.com | Graphics Module | ERROR         | NEW         | Exception drawing on remote screen |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Alice can remove her assets
        When I use the identity alice1
        And I remove the following asset of type org.securelog.mynetwork.ErrorMessage
            | messageId |
            | 001       |
        Then I should not have the following assets of type org.securelog.mynetwork.ErrorMessage
            | messageId |
            | 001       |

    Scenario: Alice cannot remove Bob's assets
        When I use the identity alice1
        And I remove the following asset of type org.securelog.mynetwork.ErrorMessage
            | messageId |
            | 002       |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Bob can remove his assets
        When I use the identity bob1
        And I remove the following asset of type org.securelog.mynetwork.ErrorMessage
            | messageId |
            | 002       |
        Then I should not have the following assets of type org.securelog.mynetwork.ErrorMessage
            | messageId |
            | 002       |

    Scenario: Bob cannot remove Alice's assets
        When I use the identity bob1
        And I remove the following asset of type org.securelog.mynetwork.ErrorMessage
            | messageId |
            | 001       |
        Then I should get an error matching /does not have .* access to resource/

    Scenario: System can post an error message
        When I use the identity system1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.postErrorMessage", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "messageId":"051", "errorType":"Math Module", "errorSeverity":"WARNING","errorStatus":"NEW","errorText":"Exception in module divide"}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"051", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "errorType":"Math Module", "errorSeverity":"WARNING","errorStatus":"NEW","errorText":"Exception in module divide"}
            ]
            """

    Scenario: System can post an error message without creator and status
        When I use the identity system1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.postErrorMessage", "owner":"org.securelog.mynetwork.Member#alice@email.com", "messageId":"051", "errorType":"Math Module", "errorSeverity":"WARNING","errorText":"Exception in module divide"}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"051", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "errorType":"Math Module", "errorSeverity":"WARNING","errorStatus":"NEW","errorText":"Exception in module divide"}
            ]
            """

    Scenario: Alice cannot post an error message
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.postErrorMessage", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "messageId":"051", "errorType":"Math Module", "errorSeverity":"WARNING","errorStatus":"NEW","errorText":"Exception in module divide"}
            ]
            """
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Alice can update an owner for error message she owns
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateErrorMessageOwner", "oldMessage":"org.securelog.mynetwork.ErrorMessage#001", "newOwner":"org.securelog.mynetwork.Level3#george@email.com"}
            ]
            """
        Then I should not have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"001", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Level3#george@email.com", "errorType":"Math Module","errorSeverity":"CRITICAL","errorStatus":"NEW","errorText":"Exception in the function add"}
            ]
            """

    Scenario: Alice can update an error message status
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateErrorMessageStatus", "oldMessage":"org.securelog.mynetwork.ErrorMessage#001", "newStatus":"RESEARCH"}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"001", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "errorType":"Math Module","errorSeverity":"CRITICAL","errorStatus":"RESEARCH","errorText":"Exception in the function add"}
            ]
            """

    Scenario: Alice can not update Bob's error message status
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateErrorMessageStatus", "oldMessage":"org.securelog.mynetwork.ErrorMessage#002", "newStatus":"RESEARCH"}
            ]
            """
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Alice can update an error message severity
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateErrorMessageSeverity", "oldMessage":"org.securelog.mynetwork.ErrorMessage#001", "newSeverity":"ERROR"}
            ]
            """
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"001", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "errorType":"Math Module","errorSeverity":"ERROR","errorStatus":"NEW","errorText":"Exception in the function add"}
            ]
            """

    Scenario: Alice can not update Bob's error message severity
        When I use the identity alice1
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateErrorMessageSeverity", "oldMessage":"org.securelog.mynetwork.ErrorMessage#002", "newSeverity":"ERROR"}
            ]
            """
        Then I should get an error matching /does not have .* access to resource/

    Scenario: Alice can update an owner for error message she owns, can't see it after update but george can
        When I use the identity alice1
        And I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"001", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Member#alice@email.com", "errorType":"Math Module","errorSeverity":"CRITICAL","errorStatus":"NEW","errorText":"Exception in the function add"}
            ]
            """
        And I submit the following transaction
            """
            [
            {"$class":"org.securelog.mynetwork.updateErrorMessageOwner", "oldMessage":"org.securelog.mynetwork.ErrorMessage#001", "newOwner":"org.securelog.mynetwork.Level3#george@email.com"}
            ]
            """
        And I should not have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"001", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Level3#george@email.com", "errorType":"Math Module","errorSeverity":"CRITICAL","errorStatus":"NEW","errorText":"Exception in the function add"}
            ]
            """
        And I use the identity george1
        Then I should have the following assets
            """
            [
            {"$class":"org.securelog.mynetwork.ErrorMessage", "messageId":"001", "creator":"org.securelog.mynetwork.System#system@email.com", "owner":"org.securelog.mynetwork.Level3#george@email.com", "errorType":"Math Module","errorSeverity":"CRITICAL","errorStatus":"NEW","errorText":"Exception in the function add"}
            ]
            """


