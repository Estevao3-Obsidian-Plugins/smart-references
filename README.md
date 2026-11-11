# Smart References

Connect text passages to internal block references in Obsidian.

Smart References highlights a passage in your note when you hover over an internal link pointing to its matching reference.

## Features

- Highlight text passages when hovering over their associated internal links.
- Choose from a palette of 12 highlight colors.
- Enable or disable underlining for each reference.
- Create references directly from the editor context menu.
- Automatically match HTML span classes with Obsidian block references.
- Customize the appearance of each reference individually.

## How to use

### 1. Create a reference

1. Select a passage in the editor.
2. Right-click and choose **Smart References**.
3. Enter a reference identifier.
4. Choose a highlight color.
5. Enable or disable underlining.
6. Apply the reference.

The selected text will be wrapped in an HTML `<span>` element.

For example:

```html
<span class="intro-movie" data-smart-reference-color="#1e88e5" data-smart-reference-underline="true">The movie reference</span>
```

### 2. Create an internal link

Create an internal link pointing to the matching block identifier:

```markdown
[[Introduction#^intro-movie|(i)]]
```

### 3. Hover over the link

In Reading view, hover over the internal link.

The matching passage will be highlighted using the color and underline settings saved in the reference.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
