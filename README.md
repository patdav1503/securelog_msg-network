# securelog-network

> This is a distributed secure error logger.

This business network defines:

**Participants:**
`Member` `System` `Level2` `Level3` `Admin`

**Assets:**
`ErrorMessage` `Message` `Reply` `directMessage` `directReply`

**Transactions:**
`storeErrorMessage` `updateErrorMessageOwner` `updateErrorMessageStatus` `sendPublicMessage` `sendPublicReply` `sendPrivateMessage` `sendPrivateReply` `updateSubject` `updateValue`

**Events:**
`ErrorMessageCreated` `ErrorMessageOwnerUpdated` `ErrorMessageStatusUpdated` `MessageCreated` `ReplyCreated` `SubjectUpdated` `ValueUpdated`

The `sendPublicMessage` function is called when an `sendPublicMessage` transaction is submitted. The logic simply checks the validity of the optional creator and uses the current user as creator if not given.  It then creates a record in the `Message` asset registry.

The `sendPublicReply` function is called when an `sendPublicReply` transaction is submitted. The logic checks the validity of the parentMessage and optional creator.  It then creates a record in the `Reply` asset registry.

The `sendPrivateMessage` function is called when an `sendPrivateMessage` transaction is submitted. The logic simply checks the validity of the recipient and optional creator.  It then creates a record in the `directMessage` asset registry.

The `sendPrivateReply` function is called when an `sendPrivateReply` transaction is submitted. The logic simply checks the validity of the parentMessage, recipient, and the optional creator.  It then creates a record in the `directReply` asset registry.

The `updateSubject` function is called when an `updateSubject` transaction is submitted. The logic simply checks the validity of the old message and changes its subject.  It then creates a record in the appropriate asset registry based on the type of the old message.

The `updateValue` function is called when an `updateValue` transaction is submitted. The logic simply checks the validity of the old Message and changes its value.  It then updates a record in the appropriate asset registry based on the type of the old message.

To test this Business Network Definition using **Composer CLI**

From the top directory with `package.json`, run `npm install` to install network and required packages into `npm`.  Use `npm test` to run the test using `mocha` and `cucumber` as defined in the `package.json` file.  Mocha tests are located in the test subdirectory and are written in Javascript.  Cumcumber tests are located in the features subdirectory and are written in the cucumber format.

To test this Business Network Definition in the **Test** tab:

