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
    assert_select "script[src=?]", "/js/webmcp.js?v=dev"
    assert_includes response.body, "/js/collab.bundle.js?v=dev"
    assert_includes response.body, "/css/editor.css?v=dev"
    assert_includes response.body, "/monaco-editor/vs/loader.js"
  end

  # Language, theme and indent are room settings now, not per browser.
  test "the page publishes settings changes and applies the shared ones" do
    get "/room-one"

    assert_response :success
    assert_includes response.body, 'window.collab.setSetting(key, value)'
    assert_includes response.body, "window.collab.onSettings(applySharedSettings)"
    assert_includes response.body, 'publish("theme", value)'
  end

  test "every theme the picker offers has a vendored definition" do
    get "/theme-room"

    assert_response :success
    block = response.body[/id="theme".*?<\/select>/m]
    values = block.scan(/<option value="([^"]+)"/).flatten

    assert_operator values.size, :>, 2, "the picker should offer more than the built in themes"
    values.each do |value|
      next if %w[vs vs-dark].include?(value)

      assert_path_exists Rails.root.join("public/monaco-editor/themes", "#{value}.json"),
        "theme #{value} is offered but has no definition file"
    end
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
