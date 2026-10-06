package com.hivepulse.app.ui.sharing

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class InvitationLinkTest {

    private val token = "q7Zk2m-XfT9wRb3LpN8sVd1Ye5HcUa0JgIoW4tK6xPE"

    @Test
    fun `the token is found in the whole link from the email`() {
        assertEquals(token, InvitationLink.token("https://hivepulse.multihead.de/dashboard/invitations?token=$token"))
    }

    @Test
    fun `the token is found when the link is pasted with text around it`() {
        assertEquals(token, InvitationLink.token("Open this: https://x.example/i?token=$token thanks"))
    }

    @Test
    fun `the token stops at the next query parameter`() {
        assertEquals(token, InvitationLink.token("https://x.example/i?token=$token&utm=mail"))
    }

    @Test
    fun `a bare token is accepted`() {
        assertEquals(token, InvitationLink.token("  $token\n"))
    }

    @Test
    fun `something too short or odd is not a token`() {
        assertNull(InvitationLink.token(""))
        assertNull(InvitationLink.token("   "))
        assertNull(InvitationLink.token("hello"))
        assertNull(InvitationLink.token("https://x.example/i?token=short"))
        assertNull(InvitationLink.token("https://x.example/page"))
        assertNull(InvitationLink.token("not a token because it has spaces in it"))
    }
}
