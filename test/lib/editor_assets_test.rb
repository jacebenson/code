require "test_helper"

# The stylesheet is what keeps the editor filling the window instead of sitting
# in a five pixel box with a page scrollbar beside it.
class EditorAssetsTest < ActiveSupport::TestCase
  CSS = Rails.root.join("public/css/editor.css")
  THEMES = Rails.root.join("public/monaco-editor/themes")

  test "the page itself does not scroll beside the editor" do
    css = CSS.read

    assert_match(/html, body \{[^}]*overflow: hidden/m, css)
    assert_match(/#editor \{[^}]*overflow: hidden/m, css)
  end

  test "the editor fills the space it is given" do
    css = CSS.read

    assert_match(/#editor \{ flex: 1; min-height: 0;/, css)
  end

  test "theme definitions are vendored" do
    assert_path_exists THEMES
    assert_operator Dir.children(THEMES).size, :>, 10
    assert_path_exists THEMES.join("Blackboard.json")
  end
end
