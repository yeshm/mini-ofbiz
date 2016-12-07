package org.miniofbiz.ext.bean;

public class LoginToken {

	private String userName;

	private String loginIp;

	private String userLoginId;

	private String partyId;

    private String redirectUrl;

	/**
	 * 会话有效期，单位：分
	 */
	private int deadline;
	
	private String loginTime;

	/*
	 * 使用MD5算法加密上述数据项得到的字符串
	 */
	private String checkString;

	public String getLoginIp() {
		return loginIp;
	}

	public String getUserLoginId() {
		return userLoginId;
	}

	public String getPartyId() {
		return partyId;
	}

	public int getDeadline() {
		return deadline;
	}

	public String getCheckString() {
		return checkString;
	}

	public void setLoginIp(String loginIp) {
		this.loginIp = loginIp;
	}

	public void setUserLoginId(String userLoginId) {
		this.userLoginId = userLoginId;
	}

	public void setPartyId(String partyId) {
		this.partyId = partyId;
	}

	public void setDeadline(int deadline) {
		this.deadline = deadline;
	}

	public void setCheckString(String checkString) {
		this.checkString = checkString;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getLoginTime() {
		return loginTime;
	}

	public void setLoginTime(String loginTime) {
		this.loginTime = loginTime;
	}

    public String getRedirectUrl() {
        return redirectUrl;
    }

    public void setRedirectUrl(String redirectUrl) {
        this.redirectUrl = redirectUrl;
    }
}
