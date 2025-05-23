---
title: "Zero-downtime deployment of a Laravel web application"
prevFilename: "deploy"
nextFilename: "deploy-zero-downtime-2"
date: 2023-07-18
---

# Zero-downtime deployment of a Laravel web application, part 1

{{< deploy-laravel/header >}}
<div class="mt-4 mb-10">
{{< tutorials/navbar baseurl="/tutorials/deploy-laravel" index="about" >}}
</div>

This is part 1 of the coverage of zero-downtime redeployment in this series.

- [Part 1](#) (which you're reading now) explains zero-downtime redeployment and covers a few one-time manual preparations.
- [Part 2]({{< relref "deploy-zero-downtime-2" >}}) shows how to automate the zero-downtime redeployment process using a post-receive Git hook.

## Prerequisites

1. You should have read, implemented, and understood the earlier article on [server-side Git setup]({{< relref "git-server" >}}).
In particular you have a working `post-receive` hook in your server-side Git repo and understand what the hook does, i.e. copy your app to the production directory in `/srv/www/` after every Git push.
2. You should have read, followed, and understood the manual deployment steps covered in the past few articles (in particular the [Composer]({{< relref "composer" >}}), [Node.js]({{< relref "nodejs" >}}), [Laravel environment]({{< relref "env" >}}), and [Laravel directory permissions]({{< relref "permissions" >}}), and [Nginx]({{< relref "nginx" >}}) articles), and your app should be live when you visit your server's IP address from a web browser.

## How zero-downtime redeployment works {#how-it-works}

*I know how zero-downtime redeployment works, please take me directly to [preparations for deployment](#preparations).*

This redeployment workflow relies on the `post-receive` hook in your server-side Git repo and uses a special directory structure to enable zero-downtime redeployment.

A typical redeployment looks something like this:

1. You develop your app on your dev machine.
2. You push code from your dev machine to your app's server-side Git repo, triggering the `post-receive` hook.
   The `post-receive` hook then:

   1. Creates a dedicated directory in `/srv/www/laravel-project/releases/` to hold the latest version (or "release") of your app 
   1. Copies your app's code into the new release directory.
   1. Runs the standard Laravel redeployment procedure (Composer and NPM installs, rebuilding your app, caching routes and config, etc.) in the new release directory.
   1. *If* the redeployment completes successfully, publishes the new release by symlinking `/srv/www/laravel-project/active` to the latest release.

   (There are few more details we'll fill in later.)

Why would you want this?

- Redeployment is practically instant---the time needed to update a symlink.
- A failed redeployment won't bring your app down because the `active` symlink will only update on a successful redeployment.
  If a redeployment fails, Nginx simply continues serving the previous version with your users none the wiser.

### Overview of the directory structure

Zero-downtime redeployment uses a directory structure something like this:

```bash
/srv/www/laravel-project/
├── releases/
│   ├── 2023-08-25_aj42lsa2/
│   ├── 2023-09-20_sf4jd9d2/
│   └── 2023-10-01_40mc202a/
├── active/ -> releases/2023-10-01_40mc202a/  # symlink to the active release
└── shared/  # contains `.env`, `storage/`, and other files shared by all releases
```

- The `releases/` directory holds releases of your app.
- `active/` is a symlink pointing to the active release of your app (i.e. the release served to the public Web).
- The `shared/` directory contains your app's `.env` file, `storage/` directory, and any other files that are shared by all releases and/or not normally tracked by Git (e.g. a `database.sqlite` file if your app uses SQLite.)

You might also enjoy reading Loris Leiva's description of [what happens during zero-downtime redeployment](https://lorisleiva.com/deploy-your-laravel-app-from-scratch/deploy-with-zero-downtime#what-happened)---it covers similar material with a different voice (and with nicer graphics!).

{{< details summary="A few words on sharing the `storage/` directory" >}}
In this guide I've decided to share the `storage/` directory between releases of your app.
This seems to be preferred setup for Laravel apps using zero-downtime redeployment, but there is still some [confusion](https://github.com/deployphp/deployer/issues/2069) [online](https://laracasts.com/discuss/channels/servers/deployments-and-the-storage-directory) about the best way to manage the `storage/` directory between deployments.

The great benefit to sharing `storage/` is that all user uploads, logs, cache files, and other files generated by your application ([which should all be in `storage/`](https://laravel.com/docs/10.x/structure#the-storage-directory)) will persist between redeployments.

The downside (which really isn't that a big deal) is the need to manually remove the boilerplate release-specific `storage/` directory during redeployments (or just entirely Git-ignore the `storage/` directory, so you're not even pushing it from your dev machine to your server).

Feel free to modify the instructions in this guide if you have a different, preferred way of handling the `storage/` directory between deployments.
{{< /details >}}

## Preparations for deployment {#preparations}

There are a few manual preparations needed before we can automate the redeployment process.
(Don't worry---you'll only have to do these steps once.)

### Our starting point

To make sure we're on the same page, I'm assuming you've followed along with the guide so far, and that your current directory structure looks something like this:

```bash
/srv/www/laravel-project/
├── app/
├── bootstrap/
├── config/
└── ...
```

For orientation, the directory structure after working through this section should look something like this:

```bash
/srv/www/laravel-project/
├── releases/
│   └── initial/
│       ├── app/
│       ├── bootstrap/
│       ├── config/
│       ├── ...
│       ├── .env -> ../../shared/.env
│       └── storage/ -> ../../shared/storage/
├── active -> releases/initial/  # symlink to initial release
└── shared/
    ├── .env
    └── storage/
```

Here's how I'd suggest going about this:

### Move your app to the `releases/` directory

1. Create a `releases/` directory.
1. Create an `initial/` directory inside `releases/` to hold your app's "initial" release (use a different name if you like, just be consistent).
1. Move your app's files into the initial release directory (remember to move hidden dotfiles!).

Do this however you like (`mv`, a command-line file manager, etc.);
after completing this step your directory structure should look like this:

```bash
/srv/www/laravel-project/
└── releases/
    └── initial/
        ├── app/
        ├── bootstrap/
        ├── config/
        ├── .env
        └── ...
```

This will temporarily break your app (since Nginx will still be trying to server your app from the old directory structure). Don't worry, we'll fix it soon!

### Create a directory for shared files

Next, create a dedicated `shared/` directory.
This directory will store files that it makes sense to share across all versions of your app, e.g. your `.env` file, `storage/` directory, and SQLite database (if using SQLite).
Move these files from your initial release to the `shared/` directory.

After this step your directory structure should be something like this:

```bash
/srv/www/laravel-project/
├── releases/
│   └── initial/
│       ├── app/
│       ├── bootstrap/
│       ├── config/
│       └── ...
└── shared/
    ├── .env
    ├── storage/
    └── sqlite/database.sqlite  # if using SQLite
```

### Link shared files into place

Link your shared files into place (in the future a redeployment script will do this for you, but you have to do it manually for the initial release).
Here's an example shell session:

```bash
# Change into initial release directory
laravel@server$ cd /srv/www/laravel-project/releases/initial

# Link .env file into place
laravel@server:initial$ ln -s ../../shared/.env .env

# Link storage directory into place (you'll have to remove the existing one first)
laravel@server:laravel-project$ ln -s ../../shared/storage storage

# Link SQLite database into place, if using SQLite
laravel@server:laravel-project$ cd database/sqlite
laravel@server:sqlite$ ln -s ../../../../shared/sqlite/database.sqlite database.sqlite
```

Two comments:

- You must manually remove the existing storage directory in the initial release before you can overwrite it with a symlink to the shared storage directory.
This is a quirk of `ln` that stops you from overwriting an existing directory---see e.g. [this Stack Overflow answer](https://stackoverflow.com/a/38095952) for details.
- SQLite users wondering why the SQLite database is inside an `sqlite` directory: it's from the [permissions article]({{< relref "permissions" >}}#sqlite)---recall that your SQLite database must be nested inside a directory that is writable by your web server.

Here's what your directory structure should look like after this step:

```bash
/srv/www/laravel-project/
├── releases/
│   └── initial/
│       ├── app/
│       ├── bootstrap/
│       ├── config/
│       ├── .env -> ../../shared/.env
│       ├── storage/ -> ../../shared/storage/
│       └── ...
└── shared/
    ├── .env
    └── storage/
    # Add SQLite database if used by your app
```

### Create an `active` symlink

Activate your initial release by creating the `active` symlink:

```bash
# Create a symlink activating your initial release
laravel@server$ cd /srv/www/laravel-project/
laravel@server:laravel-project$ ln -s  releases/initial active
```

Your directory structure should now look like this:

```bash
/srv/www/laravel-project/
├── active/ -> releases/initial/
├── releases/
│   └── initial/
│       ├── app/
│       ├── bootstrap/
│       ├── config/
│       ├── .env -> ../../shared/.env
│       ├── storage/ -> ../../shared/storage/
│       └── ...
└── shared/
    ├── .env
    └── storage/
    # Add SQLite database if used by your app
```

### Update path to SQLite database (for SQLite users)

Non-SQLite users: ignore this and jump to the next section.

SQLite users: you'll need to update the path to your SQLite database in your `.env` file to reflect the zero-downtime directory structure.

```bash
# Update DB_DATABASE to include the `active` symlink!
DB_DATABASE=/srv/www/laravel-project/active/database/sqlite/database.sqlite
```

### Ownership and permission reset

There's a chance you unintentionally tweaked directory ownership and/or permissions while rearranging your app's directory structure to accommodate zero-downtime redeployment.

Since Laravel is a bit finicky in this regard, you should run a quick double-check that you are still using [correct Laravel permissions]({{< relref "permissions" >}}):

```bash
# Give Nginx group ownership of your app's files
laravel@server:laravel-project$ sudo chgrp -R www-data releases/ shared/

# Grant owning group write access for special directories
laravel@server$ sudo chmod -R g=rwX shared/storage
laravel@server$ sudo chmod -R g=rwX releases/initial/bootstrap/cache
laravel@server$ sudo chmod -R g=rwX shared/sqlite  # if using SQLite

# Restrict the env file's permissions (rw for owning user, r for owning group)
laravel@server:laravel-project$ chmod 640 shared/.env
```

### Update your Laravel cache

Laravel will likely still be caching references to your old directory structure, in which case you'll need to refresh your app's configuration and route cache.

```bash
laravel@server:laravel-project$ cd releases/initial

# Clear configuration and route cache
laravel@server:initial$ php artisan config:clear
laravel@server:initial$ php artisan route:clear

# Recache your config and routes
laravel@server:initial$ php artisan config:cache
laravel@server:initial$ php artisan route:cache
```

### Update your Nginx config

Open your site's Nginx config file (`/etc/nginx/sites-available/laravel-project` if you're following along with the guide) and update the `root` directive to use the `active` symlink.

The new `root` directive should look like this:

```nginx
root /srv/www/laravel-project/active/public;
```

Test the syntax of the updated Nginx config, then reload Nginx:

```bash
# Test Nginx config syntax is OK, then reload config
laravel@server$ sudo nginx -t
laravel@server$ sudo systemctl restart nginx.service
```

### Moment of truth

At this point Nginx should have picked up on the updated zero-downtime redeployment directory structure, and your app should again be live when you visit your server's IP address from a web browser.

{{< details summary="Ran into problems?" >}}
At the risk of being super annoying, give this article (*including the prerequisites!*) a reread and double-check every setting is correct---there are a lot of moving parts here and one misconfiguration will bring your app down.

If you're sure you've exactly followed this article and your app is still down, please [let me know](/contact)---I've done my best to battle-test this guide to make triple-check everything works, but there could still be mistakes, which I would want to fix.
{{< /details >}}

**Next:** The next article shows how to automate zero-downtime redeployment.

<div class="mt-8">
{{< tutorials/navbar baseurl="/tutorials/deploy-laravel" index="about" >}}
</div>

<div class="mt-8">
{{< tutorials/thank-you >}}
<div>

<div class="mt-6">
{{< tutorials/license >}}
<div>

