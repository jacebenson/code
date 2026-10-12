require "test_helper"

class EditorFlowTest < ActionDispatch::IntegrationTest
  test "the root path starts a fresh room" do
    get "/"

    assert_response :redirect
    assert_match %r{/[a-z0-9]{8}\z}, response.location
  end

  test "the new room path redirects to a room" do
    get "/new"

    assert_response :redirect
    assert_match %r{/[a-z0-9]{8}\z}, response.location
  end

  test "a room shows the editor with the collaboration bundle" do
    get "/room-one"

    assert_response :success
    assert_select "body[data-room=?]", "room-one"
    assert_select "#editor"
    assert_select "#userlist"
    assert_select "input#display-name"
    assert_select "select#lang"
    assert_select "script[src=?]", "/js/webmcp.js?v=2"
    assert_includes response.body, "/js/collab.bundle.js"
    assert_includes response.body, "/monaco-editor/vs/loader.js"
  end

  test "the editor page has no hosted realtime dependency left in it" do
    get "/room-one"

    refute_includes response.body.downcase, "firebase"
    refute_includes response.body.downcase, "firepad"
    refute_includes response.body.downcase, "unpkg.com"
    refute_includes response.body.downcase, "gstatic.com"
  end

  test "the signaling endpoint answers a plain request" do
    get "/signal"

    assert_response :success
    assert_equal "okay", response.body
  end

  test "the health endpoint answers" do
    get "/up"

    assert_response :success
  end
end
