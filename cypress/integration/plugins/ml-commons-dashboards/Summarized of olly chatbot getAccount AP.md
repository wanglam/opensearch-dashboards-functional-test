Summarized of olly chatbot getAccount API MDS discussions. 
1. The olly chat bot send message button will be always enabled in 2.15. Will remove the permission control logic in front end. All permission control logic should be done in ml-commons backend side.
2. The save to notebook button will disabled when MDS enabled.
3. The save to notebook button will be enabled when MDS disabled, the user name will be refactor to request itself.
4. Since we don't need to call getAccount API anymore. Should remove security dashboards dependency.