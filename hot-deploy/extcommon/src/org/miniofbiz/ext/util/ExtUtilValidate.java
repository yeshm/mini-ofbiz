package org.miniofbiz.ext.util;

import org.ofbiz.base.util.UtilValidate;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ExtUtilValidate extends UtilValidate {

    public static final int digitsInCNMobileNumber = 11;

    public static boolean isCNMobileNumber(String s) {
        if (isEmpty(s)) return defaultEmptyOK;
        String normalizedPhone = stripCharsInBag(s, phoneNumberDelimiters);

        if (!isInteger(normalizedPhone) || normalizedPhone.length() != digitsInCNMobileNumber) {
            return false;
        }

        Pattern p = Pattern.compile("^0?(13|15|17|18|14)[0-9]{9}$",
                Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(s);
        return m.matches();
    }
}
